import {defineType, defineField, defineArrayMember} from 'sanity'

const COLOR_THEMES = [
  {title: 'Default', value: 'default'},
  {title: 'Colorway 1', value: 'colorway-1'},
  {title: 'Colorway 2', value: 'colorway-2'},
  {title: 'Colorway 3', value: 'colorway-3'},
  {title: 'Colorway 4', value: 'colorway-4'},
  {title: 'Colorway 5', value: 'colorway-5'},
  {title: 'Colorway 6', value: 'colorway-6'},
  {title: 'Colorway 7', value: 'colorway-7'},
  {title: 'About', value: 'about'},
  {title: 'Services', value: 'services'},
]

export const servicesPage = defineType({
  name: 'servicesPage',
  title: 'Services',
  type: 'document',

  fields: [
    defineField({
      name: 'headline_1',
      title: 'Headline — Line 1',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'headline_2',
      title: 'Headline — Line 2 (italic)',
      type: 'string',
    }),

    defineField({
      name: 'sidebar_label',
      title: 'Sidebar Heading',
      type: 'string',
      description: 'e.g. "Start a project"',
      initialValue: 'Start a project',
    }),

    defineField({
      name: 'availability',
      title: 'Availability Note',
      type: 'string',
      description: 'Short note about current project availability for the sidebar.',
    }),

    defineField({
      name: 'sidebar_photo',
      title: 'Sidebar Photo',
      type: 'image',
      description: 'Landscape photo shown in the sidebar (approx 196×131px).',
    }),

    defineField({
      name: 'approach',
      title: 'Approach',
      type: 'text',
      description: 'Separate paragraphs with a blank line.',
      rows: 10,
    }),

    defineField({
      name: 'services',
      title: 'Services',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),

    defineField({
      name: 'clients',
      title: 'Who We Work With',
      type: 'array',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),

    defineField({
      name: 'city_guides_label',
      title: 'City Guides — Section Heading',
      type: 'string',
      initialValue: 'Travel Guides',
    }),

    defineField({
      name: 'city_guides_intro',
      title: 'City Guides — Intro',
      type: 'text',
      rows: 4,
    }),

    defineField({
      name: 'cities',
      title: 'City Guides — Cities',
      type: 'array',
      description: 'Each city with an optional URL for a guide link.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'City name', type: 'string'}),
            defineField({name: 'url', title: 'Guide URL', type: 'url'}),
          ],
          preview: {
            select: {title: 'name', subtitle: 'url'},
          },
        }),
      ],
    }),

    defineField({
      name: 'color_theme',
      title: 'Color Theme',
      type: 'string',
      options: {list: COLOR_THEMES},
      initialValue: 'services',
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

    defineField({
      name: 'og_image',
      title: 'SEO — Share image',
      type: 'image',
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Services'}
    },
  },
})
