# Contentful Space Sync
[![deprecated](http://badges.github.io/stability-badges/dist/deprecated.svg)](http://github.com/badges/stability-badges)

[![npm](https://img.shields.io/npm/v/contentful-space-sync.svg)](https://www.npmjs.com/package/contentful-space-sync)
[![Build Status](https://travis-ci.org/contentful/contentful-space-sync.svg?branch=master)](https://travis-ci.org/contentful/contentful-space-sync)
[![Coverage Status](https://coveralls.io/repos/github/contentful/contentful-space-sync/badge.svg?branch=master)](https://coveralls.io/github/contentful/contentful-space-sync?branch=master)
[![Dependency Status](https://david-dm.org/contentful/contentful-space-sync.svg)](https://david-dm.org/contentful/contentful-space-sync)
[![devDependency Status](https://david-dm.org/contentful/contentful-space-sync/dev-status.svg)](https://david-dm.org/contentful/contentful-space-sync#info=devDependencies)

[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg)](https://github.com/semantic-release/semantic-release)
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

## Deprecation Notice

We have replaced this tool with the [contentful-export](https://github.com/contentful/contentful-export/) and [contentful-import](https://github.com/contentful/contentful-import/) tools and is now considered deprecated. We won't offer support regarding the usage of this tool.

The new export tool allows you to export all content, including content types, assets and webhooks from a space. The new import tool enables you to import external content into a new space.

Read more about the steps involved in [our guide for managing synchronization between multiple spaces](https://www.contentful.com/developers/docs/concepts/multiple-environments/).

## What this tool is for

This tool allows you to perform a **one way** synchronization of **published** content from one Contentful space to another.

The tool makes use of Contentful's [Synchronization API](https://www.contentful.com/developers/docs/concepts/sync/) which means that if you run the tool in the future with the provided token, you will only synchronize new and updated Entries and Assets, as well as remove any that have been deleted.

### Development environments

-   You have a Production space where your content editors create and publish content
-   You want your developers to work on new features without touching the production content
-   Use the tool to create copies of your Production space where your Developers can try things out at will

### Field deletion for published Content Types / Entries

-   See the [Deleting Fields](#deleting-fields) section

### Creating new spaces with a similar content model

-   If you want to start out with a content model similar to what you have on another space, you can use the `--content-model-only` option

## What this tool can be used for (but isn't advised)

### Published content backups

While this is possible, we do not advise that you use this tool for backups for the following reasons:

-   This tool only synchronizes **published** content. Anything in Draft mode or any unpublished changes to a published Entry will not be synchronized.
-   Your content might have broken links (see [contentful-link-cleaner](https://github.com/contentful/contentful-link-cleaner))
-   The tool attempts to create every Content Type, Entry and Asset separately, so if failures such as network failures occur your copy might not be complete
-   Contentful already [backups your content](https://www.contentful.com/faq/backup-security-and-hosting/) and provides extra offsite backup capabilities

## What this tool shouldn't be used for

### Workflow management

-   Initially, this tool was born as a replacement for [contentful-publication](https://github.com/jsebfranck/contentful-publication), a tool built to manage publication workflows, in which editors would work in a Source space, and content approved and meant for publishing would be synchronized to a Destination space
-   However, Contentful now has an improved [Roles and Permissions](https://www.contentful.com/r/knowledgebase/roles-and-permissions/) system, which allows for an easier content approval process

# How does it work?

Each time you run the tool it stores a [synchronization token](https://www.contentful.com/developers/docs/concepts/sync/) so only new Entries and Assets get copied, and so that deleted items can also be deleted on the destination space. See the [Synchronization](https://www.contentful.com/developers/docs/concepts/sync/) documentation for more details.

Content Types will always be updated as they are not retrieved by the synchronization API, and Content Types which don't exist anymore in the source space will be deleted in the destination space as well.

If you make any manual changes in the destination space, be aware that **this tool will overwrite any changes** you've made to entities with the same ids as those existent on the source space.

Also, avoid creating new Content Types and Entries in the destination space. This tool is intended to be used with a workflow where you create content on one space and then regularly copy it somewhere else in an automated way.

# Changelog

Check out the [releases](https://github.com/contentful/contentful-space-sync/releases) page.

# Install

`npm install -g contentful-space-sync`

# Usage

    Usage: contentful-space-sync [options]

    Options:
      --version                       Show version number

      --source-space                  ID of Space with source data
                                      [string] [required]

      --destination-space             ID of Space data will be copied to
                                      [string] [required]

      --source-delivery-token         Delivery API token for source space
                                      [string] [required]

      --management-token              Management API token for both spaces.
                                      [string]

      --source-management-token       Management API token for source space, if
                                      different from --management-token.
                                      [string]

      --destination-management-token  Management API token for destination space if
                                      different from --management-token.
                                      [string]

      --pre-publish-delay             Delay in milliseconds to account for delay
                                      after creating entities, due to internal
                                      database indexing
                                      [default: 5000]

      --sync-token-dir                Defines the path for storing sync token files
                                      (default path is the current directory)
                                      [string]

      --content-model-only            Copies only content types and locales
                                      [boolean]

      --skip-content-model            Skips content types and locales. Copies only entries and assets
                                      [boolean]

      --skip-locales                  Skips locales. Must be used with --content-model-only.
                                      Copies only content types.
                                      [boolean]

      --delivery-host                 Host for the Delivery API.
                                      [string]

      --delivery-port                 Port for the Delivery API.
                                      [string]

      --delivery-insecure             If the Delivery API should use http instead of the default https.
                                      [boolean]

      --management-host               Host for the Management API.
                                      [string]

      --management-port               Port for the Management API.
                                      [string]

      --management-insecure           If the Management API should use http instead of the default https.
                                      [boolean]

      --proxy-host                    hostname of the proxy server. [string]

      --proxy-port                    port of the proxy server. [string]

      --rate-limit                    How many request per period of time, default 6 [number]

      --rate-limit-period             How much time to wait before retry in ms, default 1000 [number]     

      --config                        Configuration file with required values

The `--management-token` parameter allows you to specify a token which will be used for both spaces. If you get a token from <https://www.contentful.com/developers/docs/references/authentication/> and your user account has access to both spaces, this should be enough.

In case you actually need a different management token for any of the spaces, you can use the `--source-management-token` and `--destination-management-token` options to override it.

Check the `example-config.json` file for an example of what a configuration file would look like. If you use the config file, you don't need to specify the other options for tokens and space ids.

# Example usage

    contentful-space-sync \
      --source-space sourceSpaceId \
      --source-delivery-token sourceSpaceDeliveryToken \
      --destination-space destinationSpaceId \
      --destination-management-token destinationSpaceManagementToken

or

    contentful-space-sync --config example-config.json

You can create your own config file based on the [`example-config.json`](example-config.json) file.

# Usage as a library

While this tool is mostly intended to be used as a command line tool, it can also be used as a Node library:

```js
var spaceSync = require('contentful-space-sync')

spaceSync(options)
.then((output) => {
  console.log('sync token', output.nextSyncToken)
})
.catch((err) => {
  console.log('oh no! errors occurred!', err)
})
```

The options object can contain any of the CLI options but written with a camelCase pattern instead, and no dashes. So `--source-space` would become `sourceSpace`.

Apart from those options, there are two additional ones that can be passed to it:

-   `errorLogFile` - File to where any errors will be written.
-   `syncTokenFile` - File to where the sync token will be written.

The method returns a promise, where, if successful, you'll have an object which contains the `nextSyncToken` (only thing there at the moment). If not successful, it will contain an object with errors.

You can look at [`bin/space-sync`](bin/space-sync) to check how the CLI tool uses the library.

# Synchronizing a space over time

This tool uses the Contentful [Synchronization](https://www.contentful.com/developers/docs/concepts/sync/) endpoint to keep content synchronized over repeated runs of the script.

Behind the scenes, when you use the sync endpoint, apart from the content it also returns a sync token in its response. The sync token encodes information about the last synchronized content, so that when you request a new synchronization, you can supply it this content and you'll only get new and updated content, as well a list of what content has been deleted.

When you run this tool, it will create a file in the current directory named `contentful-space-sync-token-sourceSpaceId-destinationSpaceId`. If you run the tool again in the directory where this file resides, with the same source and destination space IDs, it will read the token from the file. If you have a token from somewhere else you can just create the file manually.

# The error log

If any errors occur during synchronization, the tool will also create a time stamped log file (`contentful-space-sync-timestamp.log`) with a list of any errors which occurred, and links to the entities in the source space which might have problems that need to be fixed.

The most common problem will probably be an `UnresolvedLinks` error, which means a published entry A links to another entry B or asset C which has been deleted since publishing of the entry A.

If you come across this problem, you can use [contentful-link-cleaner](https://github.com/contentful/contentful-link-cleaner) to clean all of those unresolved references.

# Copying only the content model

By using the `--content-model-only` option, you can copy only Content Types and Locales. This means you'll get a space with the same content structure, but with no content at all.

This might be useful if you have been trying things out but want to start fresh with your content, or if you have a need to [delete fields](#deleting-fields) from your existing Content Types.

# Copying only content

By using the `--skip-content-model` option, you can copy only Entries and Assets. This assumes you have used this script before with the `--content-model-only` option or created the exact same content structure by hand.

Every time you run the script without any of these options, it will attempt to update the content model as well, so on subsequent syncs it might be desirable to use this option to make things a bit faster.

# Deleting fields

While we used to recommend this tool as a way to do field deletion through a specific workflow, this feature is now available on the Contentful UI.

# What happened to --force-overwrite and --fresh ?

These options were very problematic and caused more problems than they solved, so they were removed on version 4. You can see more details [here](https://github.com/contentful/contentful-space-sync/commit/066c629fec0e4c41b2094cbf6f5b01697c0b525f) and [here](https://github.com/contentful/contentful-space-sync/commit/44f1ac81ec12850c4342d91d53e0386dff68de32).

If you think you need these options, we advise you create a new, empty space, and restart the synchronization process from scratch.

If you really really really REALLY need those options and you are aware of how much trouble they can cause, you can always use an older version of the tool.
