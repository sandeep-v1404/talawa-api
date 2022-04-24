const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const createPost = require('../../../lib/resolvers/post_mutations/createPost');
const likePost = require('../../../lib/resolvers/post_mutations/likePost');
const unlikePost = require('../../../lib/resolvers/post_mutations/unlikePost');

const { USER_NOT_FOUND, POST_NOT_FOUND } = require('../../../constants');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Unlike Post Mutation without User', async () => {
    const args = {};

    //  Simultaing user with random ObjectID
    const context = {
      userId: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await unlikePost({}, args, context);
    }).rejects.toEqual(Error(USER_NOT_FOUND));
  });

  test('Unlike Post Mutation without existing Post', async () => {
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
      await unlikePost({}, args, context);
    }).rejects.toEqual(Error(POST_NOT_FOUND));
  });

  test('Unlike Post Mutation if already unliked by the user', async () => {
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
      id: createPostResponse._id,
    };

    // To unlike a post, it should be liked first
    await likePost({}, args, context);

    // First time running unlikePost Mutation to unlike
    await unlikePost({}, args, context);

    // running unlikePost Mutation to check Line #56
    const response = await unlikePost({}, args, context);

    expect(response.text).toEqual('text');
    expect(response.title).toEqual('title');
    expect(response.status).toEqual('ACTIVE');
    expect(response.creator).toEqual(signUpResponse.user._id);
    expect(response.organization).toEqual(createOrgResponse._id);
    expect(response.likeCount).toEqual(0);
  });

  test('Unlike Post Mutation', async () => {
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
      id: createPostResponse._id,
    };

    await likePost({}, args, context);
    const response = await unlikePost({}, args, context);

    expect(response.text).toEqual('text');
    expect(response.title).toEqual('title');
    expect(response.status).toEqual('ACTIVE');
    expect(response.creator).toEqual(signUpResponse.user._id);
    expect(response.organization).toEqual(createOrgResponse._id);
    expect(response.likeCount).toEqual(0);
  });
});
