# Contentful Space Sync

This tools allows you to perform a **one way** synchronization from one Contentful space to another.

Assuming you have a source space and a destination space, you can keep **published** content synchronized over time. Any draft or unsaved content will not be synchronized.

Each time you run the tool it stores a [synchronization token](https://www.contentful.com/developers/docs/concepts/sync/) so only new Entries and Assets get copied, and so that deleted items can also be deleted on the destination space. See the [Synchronization](https://www.contentful.com/developers/docs/concepts/sync/) documentation for more details.

Content Types will always be updated as they are not retrieved by the synchronization API, and Content Types which don't exist anymore in the source space will be deleted in the destination space as well.

If you make any manual changes in the destination space, be aware that this script will overwrite any changes you've made to entities with the same ids as those existent on the source space.

# Install

`npm install -g contentful-space-sync`

# Usage

```
Usage: bin/space-sync [options]

Options:
  --source-space                        ID of Space with source data
                                        [string] [required]
                                                             
  --source-space-delivery-token         Delivery API token for source space
                                        [string] [required]
                                                             
  --source-space-management-token       Management API token for source space
                                        [string] [required]
                                                             
  --destination-space                   ID of Space data will be copied to
                                        [string] [required]
                                                             
  --destination-space-delivery-token    Delivery API token for destination space
                                        [string] [required]
                                                             
  --destination-space-management-token  Management API token for destination
                                        space.
                                        If the user of the token for the source
                                        space also has access to this space
                                        there is no need to specify it again.
                                        [string] [optional]
                                                                        
  --fresh                               Ignores an existing sync token and syncs
                                        from the start
                                        [boolean] [optional]
                                        
  --config                              Configuration file with required values
                                        [optional]
```

Check the `example-config.json` file for an example of what a configuration file would look like. If you use the config file, you don't need to specify the other options for tokens and space ids.
