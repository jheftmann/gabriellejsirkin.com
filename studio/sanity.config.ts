import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {media} from 'sanity-plugin-media'
import {schemaTypes} from './schemaTypes'

const singletonTypes = new Set(['siteSettings', 'homePage', 'aboutPage', 'servicesPage', 'projectOrder'])


const singletonActions = new Set(['publish', 'discardChanges', 'restore'])

export default defineConfig({
  name: 'gabrielle-sirkin',
  title: 'Gabrielle J. Sirkin',

  projectId: process.env.SANITY_STUDIO_PROJECT_ID || 't4atn37a',
  dataset: process.env.SANITY_STUDIO_DATASET || 'production',

  plugins: [
    structureTool({
      structure: (S) =>
        S.list()
          .title('Content')
          .items([
            S.documentTypeListItem('project').title('Projects'),
            S.listItem()
              .title('Homepage Order')
              .child(S.document().schemaType('projectOrder').documentId('projectOrder')),
            S.divider(),
            S.documentTypeListItem('landingPage').title('Landing Pages'),
            S.divider(),
            S.listItem()
              .title('Pages')
              .child(
                S.list()
                  .title('Pages')
                  .items([
                    S.listItem()
                      .title('Home')
                      .child(S.document().schemaType('homePage').documentId('homePage')),
                    S.listItem()
                      .title('About')
                      .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
                    S.listItem()
                      .title('Services')
                      .child(S.document().schemaType('servicesPage').documentId('servicesPage')),
                  ]),
              ),
            S.divider(),
            S.listItem()
              .title('Site Settings')
              .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
          ]),
    }),
    visionTool(),
    media(),
  ],

  schema: {
    types: schemaTypes,
    // Prevent creation of multiple singleton documents
    templates: (templates) =>
      templates.filter(({schemaType}) => !singletonTypes.has(schemaType)),
  },

  document: {
    // Restrict actions on singleton types
    actions: (input, context) =>
      singletonTypes.has(context.schemaType)
        ? input.filter(({action}) => action && singletonActions.has(action))
        : input,
  },
})
