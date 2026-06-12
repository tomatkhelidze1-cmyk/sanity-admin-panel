export const sermonSeries = {
  name: 'sermonSeries',
  title: 'Sermon Series',
  type: 'document',
  fields: [
    {
      name: 'title',
      title: 'Series Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'subtitle',
      title: 'Series Subtitle / Short Intro',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'category',
      title: 'Series Category',
      type: 'string',
      options: {
        list: [
          {title: 'Spiritual Growth (სულიერი ზრდა)', value: 'spiritual'},
          {title: 'Family & Life (ოჯახი & ცხოვრება)', value: 'family'},
          {title: 'Biblical Teachings (ბიბლიური სწავლებები)', value: 'biblical'},
        ],
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'thumbnailUrl',
      title: 'Thumbnail Image',
      type: 'image',
      validation: Rule => Rule.required(),
    },
    {
      name: 'description',
      title: 'Full Description',
      type: 'text',
      validation: Rule => Rule.required(),
    },
    {
      name: 'speaker',
      title: 'Main Series Speaker',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'episodes',
      title: 'Episodes',
      type: 'array',
      of: [
        {
          type: 'object',
          name: 'episode',
          title: 'Episode',
          fields: [
            {
              name: 'title',
              title: 'Episode Title',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'speaker',
              title: 'Speaker',
              type: 'string',
              validation: Rule => Rule.required(),
            },
            {
              name: 'youtubeUrl',
              title: 'YouTube URL',
              type: 'url',
              validation: Rule => Rule.required(),
            },
            {
              name: 'duration',
              title: 'Duration (e.g. 45 წთ)',
              type: 'string',
              validation: Rule => Rule.required(),
            },
          ],
        },
      ],
    },
  ],
}
