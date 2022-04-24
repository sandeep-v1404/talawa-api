const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createPost = require('../../../lib/resolvers/post_mutations/createPost');
const createComment = require('../../../lib/resolvers/post_mutations/createComment');
const removeComment = require('../../../lib/resolvers/post_mutations/removeComment');

const {
  USER_NOT_FOUND,
  COMMENT_NOT_FOUND,
  USER_NOT_AUTHORIZED,
} = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Remove Comment Mutation without User', async () => {
    const args = {};

    //  Simultaing user with random ObjectID
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await removeComment({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Create Comment Mutation without existing Comment', async () => {
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
      await removeComment({}, args, context);
    }).rejects.toEqual(Error(COMMENT_NOT_FOUND));
  });

  test('Remove Comment Mutation without user being the Creator of comment', async () => {
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

    let context = {
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

    // SignUp a new User for simulating creator
    nameForNewUser = shortid.generate().toLowerCase();
    email = `${nameForNewUser}@test.com`;
    args = {
      data: {
        firstName: nameForNewUser,
        lastName: nameForNewUser,
        email: email,
        password: 'password',
      },
    };
    const newUserSignUpResponse = await signup({}, args);

    args = {
      id: createCommentResponse._id,
    };

    context = {
      userId: newUserSignUpResponse.user._id.toString(),
    };

    await expect(async () => {
      await removeComment({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Remove Comment Mutation', async () => {
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

    const response = await removeComment({}, args, context);

    expect(response.text).toEqual('text');
    expect(response.status).toEqual('ACTIVE');
    expect(response.creator).toEqual(signUpResponse.user._id);
    expect(response.post).toEqual(createPostResponse._id);
  });
});
