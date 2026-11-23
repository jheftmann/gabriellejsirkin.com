import {defineType, defineField, defineArrayMember} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'

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

export const project = defineType({
  name: 'project',
  title: 'Project',
  type: 'document',

  orderings: [orderRankOrdering],

  fields: [
    orderRankField({type: 'project'}),

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      description: 'URL path — matches the folder name in /projects/. Auto-generated from title.',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'coming_soon',
      title: 'Coming Soon',
      type: 'boolean',
      initialValue: false,
    }),

    defineField({
      name: 'cat',
      title: 'Categories',
      type: 'array',
      description: 'Which categories this project appears in. Must match categories in Site Settings.',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),

    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
    }),

    defineField({
      name: 'date',
      title: 'Year',
      type: 'string',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      description: 'Shown in the project header above the meta fields.',
      rows: 4,
    }),

    defineField({
      name: 'credits',
      title: 'Credits',
      type: 'text',
      description: 'Full credits line shown after the year, e.g. "Photography: X — Styling: Y"',
      rows: 2,
    }),

    defineField({
      name: 'credits_list',
      title: 'Credits (structured)',
      type: 'array',
      description: 'Key–value credit pairs shown on the project page.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Label', type: 'string'}),
            defineField({name: 'value', title: 'Value', type: 'string'}),
          ],
          preview: {
            select: {title: 'label', subtitle: 'value'},
          },
        }),
      ],
    }),

    defineField({
      name: 'skills',
      title: 'Areas of Expertise',
      type: 'array',
      description: 'Tags shown on the card and project page, e.g. Visual Direction, Production',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),

    defineField({
      name: 'color_theme',
      title: 'Color Theme',
      type: 'string',
      options: {
        list: COLOR_THEMES,
        layout: 'radio',
      },
      initialValue: 'default',
    }),

    defineField({
      name: 'card_ratio',
      title: 'Card Ratio',
      type: 'string',
      options: {
        list: [
          {title: '4:3', value: 'r-4-3'},
          {title: '16:9', value: 'r-16-9'},
          {title: '3:4', value: 'r-3-4'},
          {title: '2:3', value: 'r-2-3'},
          {title: '9:16', value: 'r-9-16'},
          {title: '3:2', value: 'r-3-2'},
        ],
        layout: 'radio',
      },
    }),

    defineField({
      name: 'thumbnail',
      title: 'Card Thumbnail',
      type: 'file',
      description:
        'Override the card thumbnail. Leave blank to use the first project image. Accepts images or mp4 video.',
      options: {accept: 'image/*,video/mp4'},
    }),

    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      description:
        'Images and videos in display order. Drag to reorder. Mix stills and video freely.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'file',
              title: 'File',
              type: 'file',
              options: {accept: 'image/*,video/mp4'},
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'caption',
              title: 'Caption',
              type: 'string',
              description:
                'Optional caption shown below the media. Supports markdown links [text](url).',
            }),
            defineField({
              name: 'bts',
              title: 'Behind the Scenes',
              type: 'boolean',
              description: 'Mark this item as behind-the-scenes.',
              initialValue: false,
            }),
          ],
          preview: {
            select: {title: 'file.asset.originalFilename', subtitle: 'caption'},
            prepare({title, subtitle}) {
              return {title: title || 'Media item', subtitle}
            },
          },
        }),
      ],
    }),

    defineField({
      name: 'og_title',
      title: 'SEO — Title override',
      type: 'string',
      group: 'seo',
    }),

    defineField({
      name: 'og_description',
      title: 'SEO — Description',
      type: 'string',
      group: 'seo',
    }),

    defineField({
      name: 'og_image',
      title: 'SEO — Share image',
      type: 'image',
      group: 'seo',
    }),
  ],

  fieldsets: [
    {name: 'seo', title: 'SEO', options: {collapsible: true, collapsed: true}},
  ],

  groups: [
    {name: 'seo', title: 'SEO'},
  ],

  preview: {
    select: {
      title: 'title',
      client: 'client',
      media: 'thumbnail',
    },
    prepare({title, client, media}) {
      return {
        title,
        subtitle: client || '',
        media,
      }
    },
  },
})
