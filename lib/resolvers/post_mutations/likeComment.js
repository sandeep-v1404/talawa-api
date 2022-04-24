const User = require('../../models/User');
const Comment = require('../../models/Comment');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');

const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  COMMENT_NOT_FOUND,
  COMMENT_NOT_FOUND_MESSAGE,
  COMMENT_NOT_FOUND_CODE,
  COMMENT_NOT_FOUND_PARAM,
} = require('../../../constants');

const likeComment = async (parent, args, context) => {
  const user = await User.findById(context.userId);
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  let comment = await Comment.findById(args.id);
  if (!comment) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? COMMENT_NOT_FOUND
        : requestContext.translate(COMMENT_NOT_FOUND_MESSAGE),
      COMMENT_NOT_FOUND_CODE,
      COMMENT_NOT_FOUND_PARAM
    );
  }
  if (!comment.likedBy.includes(context.userId)) {
    let newComment = await Comment.findByIdAndUpdate(
      args.id,
      { $push: { likedBy: user }, $inc: { likeCount: 1 } },
      { new: true }
    );
    return newComment;
  }
  return comment;
};

module.exports = likeComment;
