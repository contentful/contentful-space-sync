# Contentful Space Sync

This tool allows you to perform a **one way** synchronization from one Contentful space to another.

Assuming you have a source space and a destination space, you can keep **published** content synchronized over time. Any draft or unsaved content will not be synchronized.

Each time you run the tool it stores a [synchronization token](https://www.contentful.com/developers/docs/concepts/sync/) so only new Entries and Assets get copied, and so that deleted items can also be deleted on the destination space. See the [Synchronization](https://www.contentful.com/developers/docs/concepts/sync/) documentation for more details.

Content Types will always be updated as they are not retrieved by the synchronization API, and Content Types which don't exist anymore in the source space will be deleted in the destination space as well.

If you make any manual changes in the destination space, be aware that **this tool will overwrite any changes** you've made to entities with the same ids as those existent on the source space.

Also, avoid creating new Content Types and Entries in the destination space. This tool is intended to be used with a workflow where you create content on one space and then regularly copy it somewhere else in an automated way.

# Install

`npm install -g contentful-space-sync`

# Usage

```
Usage: contentful-space-sync [options]

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

  --config                              Configuration file with required values
                                        [optional]

  --fresh                               Ignores an existing sync token and syncs
                                        from the start
                                        [boolean] [optional]

  --force-overwrite                     Forces overwrite of content on the destination
                                        space with the same ID. BEFORE USING THIS option
                                        see the section "Overwriting Content" on
                                        the README for more details.
```

Check the `example-config.json` file for an example of what a configuration file would look like. If you use the config file, you don't need to specify the other options for tokens and space ids.

# Example usage

```
contentful-space-sync \
  --source-space sourceSpaceId \
  --source-space-delivery-token sourceSpaceDeliveryToken \
  --destination-space destinationSpaceId \
  --destination-space-management-token destinationSpaceManagementToken
```

or

```
contentful-space-sync --config example-config.json
```

You can create your own config file based on the [`example-config.json`](example-config.json) file.

You can also use the `--fresh` parameter with any of the above combinations, in case you have manually deleted all content from an existent space and want to ignore an existing stored sync token.

# Synchronizing a space over time

This tool uses the Contentful [Synchronization](https://www.contentful.com/developers/docs/concepts/sync/) endpoint to keep content synchronized over repeated runs of the script.

Behind the scenes, when you use the sync endpoint, apart from the content it also returns a sync token in its response. The sync token encodes information about the last synchronized content, so that when you request a new synchronization, you can supply it this content and you'll only get new and updated content, as well a list of what content has been deleted.

When you run this tool, it will create a file in the current directory named `next-sync-token-sourceSpaceId-destinationSpaceId`. If you run the tool again in the directory where this file resides, with the same source and destination space IDs, it will read the token from the file. If you have a token from somewhere else you can just create the file manually.
# Overwriting content

On some occasions, an initial sync might fail with an unexpected error and you'd like to resume it.

An initial sync will always fail if content already exists in the destination space.

There are various reasons for this but the main one is that while entries and assets can be retrieved through the sync API, as well as deleted entries and assets, for Content Types and Locales the tool always retrieves all the Content Types and all the Locales in the source and destination spaces, compares them, and in the destination space deletes the ones that don't exist in the source space.

For this reason we don't overwrite content by default when attempting a sync on a fresh space. If you'd like to still do it, you can use the `--force-overwrite` option.

When using this option, all the entities on the destination space with the same ID as the ones on the source space will be overwritten. On subsequent syncs, any Content Types and Locales that don't exist on the source space will be deleted.
