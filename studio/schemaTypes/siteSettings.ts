import {defineType, defineField, defineArrayMember} from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',

  fields: [
    defineField({
      name: 'site_title',
      title: 'Site Title',
      type: 'string',
    }),

    defineField({
      name: 'site_description',
      title: 'Site Description',
      type: 'text',
      description: 'Used for SEO and social sharing. Aim for 120–160 characters.',
      rows: 3,
    }),

    defineField({
      name: 'site_url',
      title: 'Site URL',
      type: 'url',
    }),

    defineField({
      name: 'contact_email',
      title: 'Contact Email',
      type: 'string',
    }),

    defineField({
      name: 'contact_instagram',
      title: 'Instagram URL',
      type: 'url',
    }),

    defineField({
      name: 'contact_linkedin',
      title: 'LinkedIn URL',
      type: 'url',
    }),

    defineField({
      name: 'nav',
      title: 'Navigation',
      type: 'array',
      description: 'Navigation links in order.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string'}),
            defineField({name: 'href', title: 'URL path', type: 'string', description: 'e.g. / or /about'}),
          ],
          preview: {
            select: {title: 'label', subtitle: 'href'},
          },
        }),
      ],
    }),

    defineField({
      name: 'og_title_base',
      title: 'Base Page Title',
      type: 'string',
      description:
        'Used as the root for all page titles, e.g. "Gabrielle J. Sirkin, Creative Studio for Travel"',
    }),

    defineField({
      name: 'sharecard_url',
      title: 'Default OG Image URL',
      type: 'url',
      description: 'Fallback social share image (absolute URL) when no page-specific image is set.',
    }),

    defineField({
      name: 'ga_tracking_id',
      title: 'Google Analytics Tracking ID',
      type: 'string',
      description: 'Your GA4 Measurement ID, e.g. G-XXXXXXXXXX. Leave blank to disable analytics.',
    }),

    defineField({
      name: 'categories',
      title: 'Project Categories',
      type: 'array',
      description: 'Defines the available project categories and filter tabs. Order here controls order in the filter bar.',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Site Settings'}
    },
  },
})
