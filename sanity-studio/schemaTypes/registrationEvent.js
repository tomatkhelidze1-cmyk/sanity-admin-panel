export const registrationEvent = {
  name: 'registrationEvent',
  title: 'Registration Event',
  type: 'document',
  fields: [
    {
      name: 'eventId',
      title: 'Event Unique ID',
      type: 'string',
      options: {
        list: [
          {title: 'Youth Camp', value: 'youth-camp'},
          {title: 'Kids Camp', value: 'kids-camp'},
          {title: 'Grace Conference', value: 'conference'},
        ],
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'title',
      title: 'Event Title',
      type: 'string',
      validation: Rule => Rule.required(),
    },
    {
      name: 'status',
      title: 'Registration Status',
      type: 'string',
      options: {
        list: [
          {title: 'Open (Active)', value: 'active'},
          {title: 'Closed (Completed)', value: 'closed'},
        ],
      },
      validation: Rule => Rule.required(),
    },
    {
      name: 'dateText',
      title: 'Date / Time Text',
      type: 'string',
      placeholder: 'e.g. ივლისი, 2026',
      validation: Rule => Rule.required(),
    },
    {
      name: 'detailsText',
      title: 'Details / Metadata Text (Age range or Location)',
      type: 'string',
      placeholder: 'e.g. ასაკი: 14-20 წელი or მთავარი დარბაზი',
      validation: Rule => Rule.required(),
    },
    {
      name: 'description',
      title: 'Event Description',
      type: 'text',
      validation: Rule => Rule.required(),
    },
    {
      name: 'imageUrl',
      title: 'Event Image',
      type: 'image',
      validation: Rule => Rule.required(),
    },
  ],
}
