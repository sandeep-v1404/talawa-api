const shortid = require('shortid');
const database = require('../../../db');
const signup = require('../../../lib/resolvers/auth_mutations/signup');
const createOrganization = require('../../../lib/resolvers/organization_mutations/createOrganization');
const eventsByOrganization = require('../../../lib/resolvers/event_query/eventsByOrganization');

let createOrgResponse;

beforeAll(async () => {
  require('dotenv').config(); // pull env variables from .env file
  await database.connect();

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

  createOrgResponse = await createOrganization({}, args, context);
});

afterAll(() => {
  database.disconnect();
});

describe('Unit testing', () => {
  const orderByArgs = [
    'id_ASC',
    'id_DESC',
    'title_ASC',
    'title_DESC',
    'description_ASC',
    'description_DESC',
    'startDate_ASC',
    'startDate_DESC',
    'endDate_ASC',
    'endDate_DESC',
    'allDay_ASC',
    'allDay_DESC',
    'startTime_ASC',
    'startTime_DESC',
    'endTime_ASC',
    'endTime_DESC',
    'recurrance_ASC',
    'recurrance_DESC',
    'location_ASC',
    'location_DESC',
  ];

  orderByArgs.map((arg) => {
    test(`Events By Organization Query with orderBy ${arg}`, async () => {
      const args = {
        id: createOrgResponse._id,
        orderBy: arg,
      };
      const response = await eventsByOrganization({}, args);
      response.map((event) => {
        expect(typeof event.status === 'string').toBeTruthy();
        expect(typeof event.title === 'string').toBeTruthy();
        expect(typeof event.description === 'string').toBeTruthy();
        expect(typeof event.isPublic === 'boolean').toBeTruthy();
        expect(typeof event.isRegisterable === 'boolean').toBeTruthy();
        expect(typeof event.recurring === 'boolean').toBeTruthy();
        expect(typeof event.recurrance === 'string').toBeTruthy();
        expect(
          typeof event.location === 'string' ||
          typeof event.location === 'object' ||
          event.location === null
        ).toBeTruthy();
        expect(typeof event.startDate === 'string').toBeTruthy();
        expect(typeof event.allDay === 'boolean').toBeTruthy();
        expect(typeof event.startTime === 'string').toBeTruthy();
        expect(typeof event.endTime === 'string').toBeTruthy();
      });
    });
  });
});
