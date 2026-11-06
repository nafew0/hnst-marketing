/** Paths of the /api/v1 contract. Front end and back end both import these. */
export const apiRoutes = {
  leads: '/api/v1/leads',
  bookingSlots: '/api/v1/booking/slots',
  bookings: '/api/v1/bookings',
  events: '/api/v1/events',
  offers: '/api/v1/offers',
  wall: '/api/v1/wall',
  wallReport: '/api/v1/wall/report',
  wallRemove: '/api/v1/wall/remove',
} as const

/** GHL workflow Custom Webhook target; `:key` is GHL_WORKFLOW_SECRET. */
export const ghlWorkflowWebhookPath = '/api/webhooks/ghl-workflow/:key'
