const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createPost = require('../../../lib/resolvers/post_mutations/createPost');
const createComment = require('../../../lib/resolvers/post_mutations/createComment');
const likeComment = require('../../../lib/resolvers/post_mutations/likeComment');
const unlikeComment = require('../../../lib/resolvers/post_mutations/unlikeComment');

const { USER_NOT_FOUND, COMMENT_NOT_FOUND } = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Unlike Comment Mutation without User', async () => {
    const args = {};

    //  Simultaing user with random ObjectID
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await unlikeComment({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Unlike Comment Mutation without existing Comment', async () => {
    // SignUp a User
    let nameForNewUser = shortid.generate().toLowerCase();
    let email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signUpResponse = await signup({}, args);

    const context = {
      userId: signUpResponse.user._id.toString(),
    };

    args = {
      id: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await unlikeComment({}, args, context);
    }).rejects.toEqual(Error(COMMENT_NOT_FOUND));
  });

  test('Unlike Comment Mutation if already liked by the user', async () => {
    // SignUp the User
    let nameForNewUser = shortid.generate().toLowerCase();
    let email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = Math.random() < 0.5;
    const visibleInSearch_boolean = Math.random() < 0.5;

    args = {
      data: {
        name: name,
        description: name,
        isPublic: isPublic_boolean,
        visibleInSearch: visibleInSearch_boolean,
        apiUrl: name,
      },
    };

    const context = {
      userId: signUpResponse.user._id.toString(),
    };

    const createOrgResponse = await createOrganization({}, args, context);

    args = {
      data: {
        organizationId: createOrgResponse._id.toString(),
        text: 'text',
        title: 'title',
        status: 'ACTIVE',
      },
    };

    const createPostResponse = await createPost({}, args, context);

    args = {
      postId: createPostResponse._id,
      data: {
        text: 'text',
      },
    };

    const createCommentResponse = await createComment({}, args, context);

    args = {
      id: createCommentResponse._id,
    };
    //Like the comment before unlike
    await likeComment({}, args, context);

    // Unlike comment first time
    await unlikeComment({}, args, context);

    // Unlike comment to check LINE #49
    const response = await unlikeComment({}, args, context);
    expect(response.text).toEqual('text');
    expect(response.status).toEqual('ACTIVE');
    expect(response.creator).toEqual(signUpResponse.user._id);
    expect(response.post).toEqual(createPostResponse._id);
    expect(response.likeCount).toEqual(0);
  });

  test('Unlike Comment Mutation', async () => {
    // SignUp the User
    let nameForNewUser = shortid.generate().toLowerCase();
    let email = `${nameForNewUser}@test.com`;
    let args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const signUpResponse = await signup({}, args);

    const name = shortid.generate().toLowerCase();
    const isPublic_boolean = Math.random() < 0.5;
    const visibleInSearch_boolean = Math.random() < 0.5;

    args = {
      data: {
        name: name,
        description: name,
        isPublic: isPublic_boolean,
        visibleInSearch: visibleInSearch_boolean,
        apiUrl: name,
      },
    };

    const context = {
      userId: signUpResponse.user._id.toString(),
    };

    const createOrgResponse = await createOrganization({}, args, context);

    args = {
      data: {
        organizationId: createOrgResponse._id.toString(),
        text: 'text',
        title: 'title',
        status: 'ACTIVE',
      },
    };

    const createPostResponse = await createPost({}, args, context);

    args = {
      postId: createPostResponse._id,
      data: {
        text: 'text',
      },
    };

    const createCommentResponse = await createComment({}, args, context);

    args = {
      id: createCommentResponse._id,
    };

    await likeComment({}, args, context);

    const response = await unlikeComment({}, args, context);

    expect(response.text).toEqual('text');
    expect(response.status).toEqual('ACTIVE');
    expect(response.creator).toEqual(signUpResponse.user._id);
    expect(response.post).toEqual(createPostResponse._id);
  });
});
