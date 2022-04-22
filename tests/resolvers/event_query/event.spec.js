const shortid = require('shortid');
const mongoose = require('mongoose');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createEvent = require('../../../lib/resolvers/event_mutations/createEvent');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const eventQuery = require('../../../lib/resolvers/event_query/event');

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  test('Event Query without existing event', async () => {
    let args = {
      id: mongoose.Types.ObjectId(),
    };

    await expect(async () => {
      await eventQuery({}, args);
    }).rejects.toEqual(Error('Event not found'));
  });

  test('Event Query', async () => {
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

    const event_isPublic_boolean = Math.random() < 0.5;
    const event_isRegisterable_boolean = Math.random() < 0.5;
    const event_recurring_boolean = Math.random() < 0.5;
    const event_allDay_boolean = Math.random() < 0.5;

    args = {
      data: {
        organizationId: createOrgResponse._id,
        title: 'Talawa Conference Test',
        description: 'National conference that happens yearly',
        isPublic: event_isPublic_boolean,
        isRegisterable: event_isRegisterable_boolean,
        recurring: event_recurring_boolean,
        recurrance: 'YEARLY',
        location: 'Test',
        startDate: '2/2/2020',
        endDate: '2/2/2022',
        allDay: event_allDay_boolean,
        endTime: '2:00 PM',
        startTime: '1:00 PM',
      },
    };

    const createEventResponse = await createEvent({}, args, context);

    args = {
      id: createEventResponse._id,
    };

    const response = await eventQuery({}, args);
    console.log(response);
    expect(response.status).toEqual('ACTIVE');
    expect(response.title).toEqual('Talawa Conference Test');
    expect(response.description).toEqual(
      'National conference that happens yearly'
    );
    expect(response.isPublic).toEqual(event_isPublic_boolean);
    expect(response.isRegisterable).toEqual(event_isRegisterable_boolean);
    expect(response.recurring).toEqual(event_recurring_boolean);
    expect(response.recurrance).toEqual('YEARLY');
    expect(response.location).toEqual('Test');
    expect(response.startDate).toEqual('2/2/2020');
    expect(response.allDay).toEqual(event_allDay_boolean);
    expect(response.startTime).toEqual('1:00 PM');
    expect(response.endTime).toEqual('2:00 PM');
    expect(response.creator._id).toEqual(signUpResponse.user._id);
    expect(response.organization).toEqual(createOrgResponse._id);
  });
});
