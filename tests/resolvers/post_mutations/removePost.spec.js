const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createPost = require('../../../lib/resolvers/post_mutations/createPost');
const removePost = require('../../../lib/resolvers/post_mutations/removePost');
const {
  USER_NOT_FOUND,
  USER_NOT_AUTHORIZED,
  POST_NOT_FOUND,
} = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Remove Post Mutation without User', async () => {
    const args = {};

    //  Simultaing user with random ObjectID
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await removePost({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Remove Post Mutation without existing Post', async () => {
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

    let context = {
      userId: signUpResponse.user._id.toString(),
    };

    args = {
      id: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await removePost({}, args, context);
    }).rejects.toEqual(Error(POST_NOT_FOUND));
  });

  test('Remove Post Mutation without Creator of the Post', async () => {
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
      id: createPostResponse._id,
    };

    context = {
      userId: newUserSignUpResponse.user._id.toString(),
    };

    await expect(async () => {
      await removePost({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_AUTHORIZED));
  });

  test('Remove Post Mutation', async () => {
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
      id: createPostResponse._id,
    };

    const response = await removePost({}, args, context);

    expect(response.text).toEqual('text');
    expect(response.title).toEqual('title');
    expect(response.status).toEqual('ACTIVE');
  });
});
