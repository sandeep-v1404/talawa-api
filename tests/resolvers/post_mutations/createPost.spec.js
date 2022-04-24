const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createPost = require('../../../lib/resolvers/post_mutations/createPost');
const {
  USER_NOT_FOUND,
  ORGANIZATION_NOT_FOUND,
} = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Create Post Mutation without User', async () => {
    const args = {};

    //  Simultaing user with random ObjectID
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await createPost({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Create Post Mutation without existing Organization', async () => {
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

    args = {
      data: {
        organizationId: mongoose.Types.ObjectId(),
      },
    };

    await expect(async () => {
      await createPost({}, args, context);
    }).rejects.toEqual(Error(ORGANIZATION_NOT_FOUND));
  });

  test('Create Post Mutation', async () => {
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

    const response = await createPost({}, args, context);

    expect(response.text).toEqual('text');
    expect(response.title).toEqual('title');
    expect(response.status).toEqual('ACTIVE');
  });
});
