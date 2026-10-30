import {
  GHLError,
  GHLRateLimitError,
  HighLevel,
  LogLevel,
} from '@gohighlevel/api-client'
import Bottleneck from 'bottleneck'
import { z } from 'zod'

import {
  CUSTOM_FIELD_KEYS,
  FIELD_LABELS,
  GHL_API_VERSION,
  GHL_MAX_RPS,
  type CustomFieldKey,
} from './constants'
import { GhlRequestError, retryDelayMs } from './errors'
import { appointmentBody } from './payloads'
import type {
  AppointmentRequest,
  ContactRequest,
  ContactUpsertBody,
  CustomValue,
  FreeSlotQuery,
  GhlClient,
  OpportunityRequest,
  ProductSummary,
} from './types'

export interface GhlOptions {
  token: string
  locationId: string
  pipelineId: string
  stageNewId: string
  calendarId: string | null
}

export interface EnsuredField {
  key: CustomFieldKey
  id: string
}

export interface EnsuredTag {
  name: string
  id: string
}

export interface GhlAdmin {
  ensureFields(): Promise<EnsuredField[]>
  ensureTags(names: readonly string[]): Promise<EnsuredTag[]>
}

const opportunitySchema = z.object({
  opportunity: z.object({ id: z.string().min(1) }),
})

const slotDaySchema = z.object({ slots: z.array(z.string()) })
const slotsSchema = z.record(z.string(), slotDaySchema)

function delay(ms: number) {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, ms)
  })
}

function fromError(error: Error): GhlRequestError {
  if (error instanceof GhlRequestError) return error
  if (error instanceof GHLError) {
    const detail = error.message.replace(/\s+/g, ' ').slice(0, 160)
    return new GhlRequestError(
      `GoHighLevel request failed (${error.statusCode ?? 0}): ${detail}`,
      error.statusCode ?? 0,
      null
    )
  }
  return new GhlRequestError(error.message, 0, null)
}

function matchesField(fieldKey: string, key: CustomFieldKey) {
  return (
    fieldKey === key ||
    fieldKey === `contact.${key}` ||
    fieldKey.endsWith(`.${key}`)
  )
}

/**
 * Server-side GoHighLevel client. `token` is the Private Integration Token.
 * Callers must not pass it to the browser or a log line.
 */
export function createGhlClient(options: GhlOptions): GhlClient & GhlAdmin {
  const sdk = new HighLevel({
    privateIntegrationToken: options.token,
    apiVersion: GHL_API_VERSION,
    logLevel: LogLevel.WARN,
  })
  const limiter = new Bottleneck({
    reservoir: GHL_MAX_RPS,
    reservoirRefreshAmount: GHL_MAX_RPS,
    reservoirRefreshInterval: 1000,
    maxConcurrent: GHL_MAX_RPS,
  })
  let fieldIds: Map<CustomFieldKey, string> | null = null

  async function call<T>(run: () => Promise<T>): Promise<T> {
    return limiter.schedule(async () => {
      try {
        return await run()
      } catch (error) {
        if (error instanceof GHLRateLimitError) {
          await delay(retryDelayMs(error.rateLimit))
          try {
            return await run()
          } catch (retryError) {
            if (retryError instanceof Error) throw fromError(retryError)
            throw new GhlRequestError('GoHighLevel request failed', 0, null)
          }
        }
        if (error instanceof Error) throw fromError(error)
        throw new GhlRequestError('GoHighLevel request failed', 0, null)
      }
    })
  }

  async function fieldMap() {
    if (fieldIds) return fieldIds
    const listed = await call(() =>
      sdk.locations.getCustomFields({
        locationId: options.locationId,
        model: 'contact',
      })
    )
    const ids = new Map<CustomFieldKey, string>()
    for (const field of listed.customFields ?? []) {
      if (!field.id) continue
      for (const key of CUSTOM_FIELD_KEYS) {
        const keyHit = field.fieldKey
          ? matchesField(field.fieldKey, key)
          : false
        const nameHit = field.name === FIELD_LABELS[key]
        if (keyHit || nameHit) ids.set(key, field.id)
      }
    }
    fieldIds = ids
    return ids
  }

  async function upsertContact(input: ContactRequest) {
    const ids = await fieldMap()
    const customFields = input.customFields.map((field) => {
      const id = ids.get(field.key)
      if (!id) {
        throw new GhlRequestError(
          `Missing GoHighLevel custom field contact.${field.key}. Run scripts/ghl-setup.ts.`,
          0,
          null
        )
      }
      return { id, field_value: field.value }
    })

    const body: ContactUpsertBody = {
      locationId: options.locationId,
      firstName: input.firstName,
      email: input.email,
      source: 'website',
      tags: input.tags,
      customFields,
    }
    if (input.lastName) body.lastName = input.lastName
    if (input.phone) body.phone = input.phone
    if (input.website) body.website = input.website
    if (input.companyName) body.companyName = input.companyName
    if (input.smsDnd) body.dndSettings = { SMS: { status: 'active' } }

    const created = await call(() => sdk.contacts.upsertContact(body))
    const contactId = created.contact?.id
    if (!contactId)
      throw new GhlRequestError('Contact upsert returned no id', 0, null)
    return { contactId }
  }

  async function addNote(contactId: string, body: string) {
    const created = await call(() =>
      sdk.contacts.createNote({ contactId }, { body })
    )
    const noteId = created.note?.id
    if (!noteId)
      throw new GhlRequestError('Note create returned no id', 0, null)
    return { noteId }
  }

  async function addTags(contactId: string, tags: string[]) {
    await call(() => sdk.contacts.addTags({ contactId }, { tags }))
  }

  async function upsertOpportunity(input: OpportunityRequest) {
    const followers: string[] = []
    const body = {
      locationId: options.locationId,
      pipelineId: options.pipelineId,
      pipelineStageId: options.stageNewId,
      contactId: input.contactId,
      name: input.name,
      status: 'open',
      followers,
      isRemoveAllFollowers: false,
      followersActionType: 'add',
    }
    const created = await call(() => sdk.opportunities.upsertOpportunity(body))
    const payload: unknown = created
    const parsed = opportunitySchema.safeParse(payload)
    if (!parsed.success) {
      throw new GhlRequestError('Opportunity upsert returned no id', 0, null)
    }
    return { opportunityId: parsed.data.opportunity.id }
  }

  async function getFreeSlots(input: FreeSlotQuery) {
    if (!options.calendarId) {
      throw new GhlRequestError(
        'Discovery Call calendar id is not set',
        0,
        null
      )
    }
    const calendarId = options.calendarId
    const payload: unknown = await call(() =>
      sdk.calendars.getSlots({
        calendarId,
        startDate: input.startMs,
        endDate: input.endMs,
        timezone: input.timezone,
      })
    )
    const parsed = slotsSchema.safeParse(payload)
    if (!parsed.success) {
      throw new GhlRequestError(
        `Free-slot response did not match the expected shape. Calendar calls use Version ${GHL_API_VERSION}; stop and confirm that header before switching it.`,
        0,
        null
      )
    }
    const slots: Record<string, string[]> = {}
    for (const [day, value] of Object.entries(parsed.data))
      slots[day] = value.slots
    return slots
  }

  async function createAppointment(input: AppointmentRequest) {
    if (!options.calendarId) {
      throw new GhlRequestError(
        'Discovery Call calendar id is not set',
        0,
        null
      )
    }
    const body = appointmentBody({
      calendarId: options.calendarId,
      locationId: options.locationId,
      contactId: input.contactId,
      startTime: input.startTime,
      title: input.title,
    })
    const created = await call(() => sdk.calendars.createAppointment(body))
    if (!created.endTime) {
      throw new GhlRequestError('Appointment response had no end time', 0, null)
    }
    return {
      appointmentId: created.id,
      start: created.startTime ?? input.startTime,
      end: created.endTime,
    }
  }

  async function getCustomValues(): Promise<CustomValue[]> {
    const listed = await call(() =>
      sdk.locations.getCustomValues({ locationId: options.locationId })
    )
    const values: CustomValue[] = []
    for (const value of listed.customValues ?? []) {
      if (!value.id || !value.name) continue
      values.push({
        id: value.id,
        key: value.fieldKey ?? value.name,
        name: value.name,
        value: value.value ?? '',
      })
    }
    return values
  }

  async function listProducts(): Promise<ProductSummary[]> {
    const listed = await call(() =>
      sdk.products.listInvoices({
        locationId: options.locationId,
        limit: 100,
        offset: 0,
      })
    )
    return listed.products.map((product) => ({
      id: product._id,
      name: product.name,
    }))
  }

  async function ensureFields() {
    fieldIds = null
    let ids = await fieldMap()
    for (const key of CUSTOM_FIELD_KEYS) {
      if (ids.has(key)) continue
      try {
        await call(() =>
          sdk.locations.createCustomField(
            { locationId: options.locationId },
            { name: FIELD_LABELS[key], dataType: 'TEXT', model: 'contact' }
          )
        )
      } catch (error) {
        if (!(error instanceof GhlRequestError)) throw error
      }
    }
    fieldIds = null
    ids = await fieldMap()
    const missing = CUSTOM_FIELD_KEYS.filter((key) => !ids.has(key))
    if (missing.length > 0) {
      throw new GhlRequestError(
        `Could not create custom fields: ${missing.join(', ')}`,
        0,
        null
      )
    }
    return CUSTOM_FIELD_KEYS.flatMap((key) => {
      const id = ids.get(key)
      return id ? [{ key, id }] : []
    })
  }

  async function ensureTags(names: readonly string[]) {
    const read = async () => {
      const listed = await call(() =>
        sdk.locations.getLocationTags({ locationId: options.locationId })
      )
      return listed.tags ?? []
    }

    let tags = await read()
    for (const name of names) {
      if (tags.some((tag) => tag.name === name)) continue
      try {
        await call(() =>
          sdk.locations.createTag({ locationId: options.locationId }, { name })
        )
      } catch (error) {
        if (!(error instanceof GhlRequestError)) throw error
        tags = await read()
        if (!tags.some((tag) => tag.name === name)) throw error
      }
    }
    tags = await read()
    const ensured: EnsuredTag[] = []
    for (const name of names) {
      const tag = tags.find((item) => item.name === name)
      if (!tag?.id)
        throw new GhlRequestError(`Could not create tag ${name}`, 0, null)
      ensured.push({ name, id: tag.id })
    }
    return ensured
  }

  return {
    upsertContact,
    addNote,
    addTags,
    upsertOpportunity,
    getFreeSlots,
    createAppointment,
    getCustomValues,
    listProducts,
    ensureFields,
    ensureTags,
  }
}
