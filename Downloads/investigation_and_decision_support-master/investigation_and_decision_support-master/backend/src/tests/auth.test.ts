import { requireAuth, requireRoles, AuthenticatedRequest } from '../middleware/auth';
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { Role } from '../utils/enums';

// Mock jsonwebtoken
jest.mock('jsonwebtoken');

describe('Auth Middleware Unit Tests', () => {
  let mockRequest: Partial<AuthenticatedRequest>;
  let mockResponse: Partial<Response>;
  let nextFunction: NextFunction = jest.fn();

  beforeEach(() => {
    mockRequest = {};
    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    nextFunction = jest.fn();
  });

  test('should return 401 if no authorization header is provided', () => {
    mockRequest.headers = {};

    requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(401);
    expect(mockResponse.json).toHaveBeenCalledWith({ error: 'Authorization token required' });
  });

  test('should verify token and attach user to request', () => {
    const mockUser = { id: 'user-1', role: Role.POLICE_OFFICER, name: 'HC Shivashankar' };
    mockRequest.headers = { authorization: 'Bearer mock-valid-token' };
    
    (jwt.verify as jest.Mock).mockReturnValue(mockUser);

    requireAuth(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockRequest.user).toEqual(mockUser);
    expect(nextFunction).toHaveBeenCalled();
  });

  test('should restrict access if role is not permitted', () => {
    mockRequest.user = {
      id: 'user-1',
      email: 'officer@ksp.gov.in',
      name: 'HC Shivashankar',
      badgeNumber: 'HC-3891',
      role: Role.POLICE_OFFICER,
      districtId: null,
      policeStationId: null
    };

    const rolesGuard = requireRoles([Role.SYSTEM_ADMINISTRATOR]);
    rolesGuard(mockRequest as AuthenticatedRequest, mockResponse as Response, nextFunction);

    expect(mockResponse.status).toHaveBeenCalledWith(403);
  });
});

