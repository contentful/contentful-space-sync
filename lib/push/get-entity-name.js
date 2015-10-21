export default function getEntityName (entity) {
  return entity.name || entity.sys.id
}
