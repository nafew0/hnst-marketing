import type { Access, FieldAccess } from 'payload'

export const isAdmin: Access = ({ req }) => req.user?.role === 'admin'
export const isEditor: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'
export const adminField: FieldAccess = ({ req }) => req.user?.role === 'admin'
export const published: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'
    ? true
    : { _status: { equals: 'published' } }
export const legalPublished: Access = ({ req }) =>
  req.user?.role === 'admin' || req.user?.role === 'editor'
    ? true
    : {
        and: [
          { _status: { equals: 'published' } },
          { status: { equals: 'published' } },
        ],
      }
export const contentAccess = {
  read: published,
  create: isEditor,
  update: isEditor,
  delete: isAdmin,
}

export const adminOrSelf: Access = ({ req }) => {
  if (req.user?.role === 'admin') return true
  if (req.user) return { id: { equals: req.user.id } }
  return false
}
