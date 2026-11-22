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

export const aboutPage = defineType({
  name: 'aboutPage',
  title: 'About',
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
      name: 'lead',
      title: 'Lead Paragraph',
      type: 'string',
    }),

    defineField({
      name: 'sidebar_photo',
      title: 'Sidebar Photo',
      type: 'image',
      description: 'Portrait photo shown in the sidebar (approx 196×261px).',
    }),

    defineField({
      name: 'skills_list',
      title: 'Areas of Expertise',
      type: 'array',
      description: 'Each skill is a name + description.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'name', title: 'Name', type: 'string'}),
            defineField({name: 'description', title: 'Description', type: 'text', rows: 3}),
          ],
          preview: {
            select: {title: 'name'},
          },
        }),
      ],
    }),

    defineField({
      name: 'services_text',
      title: 'Services',
      type: 'string',
    }),

    defineField({
      name: 'bio',
      title: 'Bio',
      type: 'text',
      description: 'Separate paragraphs with a blank line.',
      rows: 8,
    }),

    defineField({
      name: 'color_theme',
      title: 'Color Theme',
      type: 'string',
      options: {list: COLOR_THEMES},
      initialValue: 'about',
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
      return {title: 'About'}
    },
  },
})
