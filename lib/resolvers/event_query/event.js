const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const Event = require('../../models/Event');

module.exports = async (parent, args) => {
  const eventFound = await Event.findOne({
    _id: args.id,
    status: 'ACTIVE',
  })
    .populate('creator', '-password')
    .populate('tasks')
    .populate('admins', '-password');

  if (!eventFound) {
    throw new NotFoundError(
      process.env.NODE_ENV !== 'production'
        ? 'Event not found'
        : requestContext.translate('event.notFound'),
      'event.notFound',
      'event'
    );
  }

  return eventFound;
};
