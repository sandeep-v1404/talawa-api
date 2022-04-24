const User = require('../../models/User');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

const { NotFoundError } = require('errors');
const requestContext = require('talawa-request-context');
const {
  IN_PRODUCTION,
  USER_NOT_FOUND,
  USER_NOT_FOUND_MESSAGE,
  USER_NOT_FOUND_CODE,
  USER_NOT_FOUND_PARAM,
  POST_NOT_FOUND,
  POST_NOT_FOUND_MESSAGE,
  POST_NOT_FOUND_CODE,
  POST_NOT_FOUND_PARAM,
} = require('../../../constants');

module.exports = async (parent, args, context) => {
  // gets user in token - to be used later on
  const user = await User.findOne({ _id: context.userId });
  if (!user) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? USER_NOT_FOUND
        : requestContext.translate(USER_NOT_FOUND_MESSAGE),
      USER_NOT_FOUND_CODE,
      USER_NOT_FOUND_PARAM
    );
  }

  const post = await Post.findOne({ _id: args.postId });
  if (!post) {
    throw new NotFoundError(
      !IN_PRODUCTION
        ? POST_NOT_FOUND
        : requestContext.translate(POST_NOT_FOUND_MESSAGE),
      POST_NOT_FOUND_CODE,
      POST_NOT_FOUND_PARAM
    );
  }

  let newComment = new Comment({
    ...args.data,
    creator: context.userId,
    post: args.postId,
  });

  await Post.updateOne(
    { _id: args.postId },
    {
      $push: {
        comments: newComment,
      },
      $inc: {
        commentCount: 1,
      },
    }
  );

  newComment = await newComment.save();

  return {
    ...newComment._doc,
  };
};
