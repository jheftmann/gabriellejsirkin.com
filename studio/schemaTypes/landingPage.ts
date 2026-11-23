import {defineType, defineField, defineArrayMember} from 'sanity'

export const landingPage = defineType({
  name: 'landingPage',
  title: 'Landing Page',
  type: 'document',

  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Display name, e.g. "Brand Work"',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL key used for filtering, e.g. "brand-work". Must match the category name in Site Settings.',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'projects',
      title: 'Projects',
      type: 'array',
      description: 'Drag to set the display order on this landing page.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'project'}],
        }),
      ],
    }),

    defineField({
      name: 'og_title',
      title: 'SEO — Title override',
      type: 'string',
    }),

    defineField({
      name: 'og_description',
      title: 'SEO — Description',
      type: 'string',
    }),
  ],

  preview: {
    select: {title: 'title', projects: 'projects'},
    prepare({title, projects}) {
      const count = Array.isArray(projects) ? projects.length : 0
      return {title, subtitle: `${count} project${count === 1 ? '' : 's'}`}
    },
  },
})
