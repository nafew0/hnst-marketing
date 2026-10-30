import {
  OpenAPIRegistry,
  OpenApiGeneratorV31,
} from '@asteasolutions/zod-to-openapi'
import { z } from 'zod'

import {
  bookingCreatedSchema,
  bookingInputSchema,
  slotsQuerySchema,
  slotsResponseSchema,
} from './booking'
import {
  errorEnvelopeSchema,
  IDEMPOTENCY_HEADER,
  idempotencyKeySchema,
  queuedSchema,
} from './common'
import { eventsInputSchema } from './events'
import { leadInputSchema } from './leads'
import { offersResponseSchema } from './offers'
import { apiRoutes } from './routes'
import { ghlWorkflowEventSchema, webhookAckSchema } from './webhooks'

const json = <T extends z.ZodType>(schema: T, description: string) => ({
  description,
  content: { 'application/json': { schema } },
})

/**
 * Builds the OpenAPI 3.1 document for /api/v1 from the Zod contracts. Schema
 * names come from Zod v4 `.meta({ id })`, which returns a copy, so the
 * contracts the site imports are never mutated or patched.
 */
export function buildOpenApiDocument() {
  const registry = new OpenAPIRegistry()

  const ErrorEnvelope = errorEnvelopeSchema.meta({ id: 'ErrorEnvelope' })
  const Queued = queuedSchema.meta({ id: 'Queued' })
  const LeadInput = leadInputSchema.meta({ id: 'LeadInput' })
  const SlotsResponse = slotsResponseSchema.meta({ id: 'SlotsResponse' })
  const BookingInput = bookingInputSchema.meta({ id: 'BookingInput' })
  const BookingCreated = bookingCreatedSchema.meta({ id: 'BookingCreated' })
  const EventsInput = eventsInputSchema.meta({ id: 'EventsInput' })
  const OffersResponse = offersResponseSchema.meta({ id: 'OffersResponse' })
  const GhlWorkflowEvent = ghlWorkflowEventSchema.meta({
    id: 'GhlWorkflowEvent',
  })

  const idempotencyHeaders = z.object({
    [IDEMPOTENCY_HEADER]: idempotencyKeySchema,
  })
  const error = (description: string) => json(ErrorEnvelope, description)

  registry.registerPath({
    method: 'post',
    path: apiRoutes.leads,
    summary: 'Submit a lead (contact, lead magnet, package interest, gift)',
    request: {
      headers: idempotencyHeaders,
      body: json(LeadInput, 'Lead form submission'),
    },
    responses: {
      202: json(
        Queued,
        'Accepted into the outbox; a repeated key replays this'
      ),
      400: error(
        'validation_failed, captcha_failed or idempotency_key_missing'
      ),
      429: error('rate_limited'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: apiRoutes.bookingSlots,
    summary: 'Free Discovery Call slots (max 31-day window)',
    request: { query: slotsQuerySchema },
    responses: {
      200: json(SlotsResponse, 'Available slots grouped by day'),
      400: error('validation_failed or slot_range_too_large'),
    },
  })

  registry.registerPath({
    method: 'post',
    path: apiRoutes.bookings,
    summary: 'Book a Discovery Call',
    request: {
      headers: idempotencyHeaders,
      body: json(BookingInput, 'Booking request'),
    },
    responses: {
      201: json(BookingCreated, 'Booked in GHL'),
      202: json(Queued, 'GHL unavailable; queued for retry'),
      400: error(
        'validation_failed, captcha_failed or idempotency_key_missing'
      ),
      409: error('slot_taken'),
      429: error('rate_limited'),
    },
  })

  registry.registerPath({
    method: 'post',
    path: apiRoutes.events,
    summary: 'Batched intent events',
    request: { body: json(EventsInput, 'Event batch') },
    responses: {
      204: { description: 'Stored' },
      400: error('validation_failed'),
      429: error('rate_limited'),
    },
  })

  registry.registerPath({
    method: 'get',
    path: apiRoutes.offers,
    summary: 'Live package prices from GHL custom values and products',
    responses: {
      200: json(OffersResponse, 'Current offers'),
      503: error('upstream_unavailable'),
    },
  })

  registry.registerPath({
    method: 'post',
    path: '/api/webhooks/ghl-workflow/{key}',
    summary: 'GHL workflow Custom Webhook (offer-changed)',
    request: {
      params: z.object({ key: z.string() }),
      body: json(GhlWorkflowEvent, 'GHL workflow payload'),
    },
    responses: {
      200: json(webhookAckSchema, 'Acknowledged (also for duplicates)'),
      400: error('validation_failed'),
      401: error('unauthorized'),
    },
  })

  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: '3.1.0',
    info: {
      title: 'HONEST Marketing website API',
      version: '1.0.0',
      description:
        'Contract between the hnst.marketing front end and its back end. Generated from lib/contracts (Zod). Do not edit by hand.',
    },
    servers: [{ url: '/' }],
  })
}
