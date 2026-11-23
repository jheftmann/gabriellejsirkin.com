import {defineType, defineField, defineArrayMember} from 'sanity'

export const projectOrder = defineType({
  name: 'projectOrder',
  title: 'Homepage',
  type: 'document',
  liveEdit: true,

  fields: [
    defineField({
      name: 'projects',
      title: 'Projects',
      type: 'array',
      description:
        'Drag to reorder. Controls the order on the homepage "All" filter. Changes are live immediately — no Publish needed.',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'project'}],
        }),
      ],
    }),
  ],

  preview: {
    prepare() {
      return {title: 'Homepage Order'}
    },
  },
})
