import {defineType, defineField, defineArrayMember} from 'sanity'
import {orderRankField, orderRankOrdering} from '@sanity/orderable-document-list'
import {ColorThemeInput} from '../components/ColorThemeInput'

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

  groups: [
    {name: 'content', title: 'Content', default: true},
    {name: 'media',   title: 'Media'},
    {name: 'seo',     title: 'SEO'},
  ],

  fields: [
    orderRankField({type: 'project'}),

    // ── Content ──────────────────────────────────────────────────────────────

    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'content',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      group: 'content',
      description: 'URL path — auto-generated from title. Don\'t change after publishing.',
      options: {source: 'title', maxLength: 96},
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'cat',
      title: 'Categories',
      type: 'array',
      group: 'content',
      description: 'Which category filters this project appears in. Must match categories in Site Settings.',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),

    defineField({
      name: 'client',
      title: 'Client',
      type: 'string',
      group: 'content',
    }),

    defineField({
      name: 'date',
      title: 'Year',
      type: 'string',
      group: 'content',
    }),

    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      group: 'content',
      description: 'Shown in the project header above the meta fields.',
      rows: 4,
    }),

    defineField({
      name: 'credits_list',
      title: 'Credits',
      type: 'array',
      group: 'content',
      description: 'Key–value credit pairs (e.g. Photography / Jane Doe). Shown on the project page.',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({name: 'label', title: 'Role', type: 'string'}),
            defineField({name: 'value', title: 'Name', type: 'string'}),
          ],
          preview: {
            select: {title: 'label', subtitle: 'value'},
          },
        }),
      ],
    }),

    defineField({
      name: 'credits',
      title: 'Credits (single line)',
      type: 'text',
      group: 'content',
      description: 'Fallback: a single credits line shown if Credits above is empty. e.g. "Photography: X — Styling: Y"',
      rows: 2,
    }),

    defineField({
      name: 'skills',
      title: 'Areas of Expertise',
      type: 'array',
      group: 'content',
      description: 'Tags shown on the project page, e.g. Visual Direction, Production',
      of: [defineArrayMember({type: 'string'})],
      options: {layout: 'tags'},
    }),

    defineField({
      name: 'coming_soon',
      title: 'Coming Soon',
      type: 'boolean',
      group: 'content',
      description: 'Hides from category filters and shows a placeholder card instead.',
      initialValue: false,
    }),

    // ── Media ─────────────────────────────────────────────────────────────────

    defineField({
      name: 'media',
      title: 'Media',
      type: 'array',
      group: 'media',
      description: 'Images and videos in display order. Drag to reorder. Mix stills and video freely.',
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
              description: 'Optional caption shown below the media. Supports markdown links [text](url).',
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
      name: 'thumbnail',
      title: 'Card Thumbnail',
      type: 'file',
      group: 'media',
      description: 'Override the card thumbnail. Leave blank to use the first media item. Accepts images or mp4 video.',
      options: {accept: 'image/*,video/mp4'},
    }),

    defineField({
      name: 'card_ratio',
      title: 'Card Aspect Ratio',
      type: 'string',
      group: 'media',
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
      name: 'color_theme',
      title: 'Color Theme',
      type: 'string',
      group: 'media',
      components: {input: ColorThemeInput},
      options: {
        list: COLOR_THEMES,
      },
      initialValue: 'default',
    }),

    // ── SEO ───────────────────────────────────────────────────────────────────

    defineField({
      name: 'og_title',
      title: 'Title override',
      type: 'string',
      group: 'seo',
      description: 'Defaults to the project title if left blank.',
    }),

    defineField({
      name: 'og_description',
      title: 'Description',
      type: 'string',
      group: 'seo',
    }),

    defineField({
      name: 'og_image',
      title: 'Share image',
      type: 'image',
      group: 'seo',
      description: 'Defaults to the project thumbnail if left blank.',
    }),
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
