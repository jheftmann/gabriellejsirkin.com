import {defineType, defineField} from 'sanity'

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

export const homePage = defineType({
  name: 'homePage',
  title: 'Home',
  type: 'document',

  fields: [
    defineField({
      name: 'hero_main',
      title: 'Hero — Line 1',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),

    defineField({
      name: 'hero_accent',
      title: 'Hero — Line 2 (optional)',
      type: 'string',
    }),

    defineField({
      name: 'color_theme',
      title: 'Color Theme',
      type: 'string',
      options: {list: COLOR_THEMES},
      initialValue: 'default',
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
      return {title: 'Home'}
    },
  },
})
