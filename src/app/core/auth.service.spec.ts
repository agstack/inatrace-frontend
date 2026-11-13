import { of } from 'rxjs';
import { AuthService } from './auth.service';

describe('AuthService', () => {

  const createService = (routeSegments: string[]) => {
    const route = {
      snapshot: {
        children: [{ url: routeSegments.map(path => ({ path })) }]
      }
    } as any;
    const router = {} as any;
    const userController = {
      getProfileForUser: jasmine.createSpy('getProfileForUser').and.returnValue(of({ data: {} }))
    } as any;

    return { service: new AuthService(route, router, userController), userController };
  };

  beforeEach(() => jasmine.clock().install());
  afterEach(() => jasmine.clock().uninstall());

  it('does not request the profile on the legacy QR routes', () => {
    for (const segment of ['q', 'p', 'q-cd', 'p-cd']) {
      const { userController } = createService([segment]);

      jasmine.clock().tick(1000);

      expect(userController.getProfileForUser)
        .withContext(`route ${segment}`)
        .not.toHaveBeenCalled();
    }
  });

  it('requests the profile on a protected route', () => {
    const { userController } = createService(['home']);

    jasmine.clock().tick(1000);

    expect(userController.getProfileForUser).toHaveBeenCalledTimes(1);
  });
});
