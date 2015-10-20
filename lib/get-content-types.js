export default function getContentTypes (client, space) {
  return client.getSpace(space)
  .then(space => {
    return space.getPublishedContentTypes()
  })
}
