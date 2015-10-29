let buffer = []

export default {
  push (err) {
    buffer.push(err)
  },

  drain () {
    return buffer.splice(0, buffer.length)
  }
}
