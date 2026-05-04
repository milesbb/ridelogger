import { describe, it, expect } from 'vitest'
import { Errors, AppError } from './errorTypes'

describe('Errors', () => {
  it('Unauthorized returns 401 with correct key', () => {
    const err = Errors.Unauthorized() as AppError
    expect(err.httpStatus).toBe(401)
    expect(err.errorKey).toBe('Unauthorized')
    expect(err.message).toBe('Unauthorized')
  })

  it('InvalidCredentials returns 401 with correct key', () => {
    const err = Errors.InvalidCredentials() as AppError
    expect(err.httpStatus).toBe(401)
    expect(err.errorKey).toBe('InvalidCredentials')
  })

  it('NotFound includes the resource name', () => {
    const err = Errors.NotFound('Passenger') as AppError
    expect(err.httpStatus).toBe(404)
    expect(err.errorKey).toBe('NotFound')
    expect(err.message).toBe('Passenger not found')
  })

  it('Conflict returns 409', () => {
    const err = Errors.Conflict('Email already registered') as AppError
    expect(err.httpStatus).toBe(409)
    expect(err.errorKey).toBe('Conflict')
    expect(err.message).toBe('Email already registered')
  })

  it('BadRequest returns 400', () => {
    const err = Errors.BadRequest('name is required') as AppError
    expect(err.httpStatus).toBe(400)
    expect(err.errorKey).toBe('BadRequest')
  })

  it('Internal returns 500 with default message', () => {
    const err = Errors.Internal() as AppError
    expect(err.httpStatus).toBe(500)
    expect(err.errorKey).toBe('Internal')
    expect(err.message).toBe('Internal server error')
  })

  it('Internal returns 500 with custom message', () => {
    const err = Errors.Internal('Something broke') as AppError
    expect(err.message).toBe('Something broke')
  })

  it('errors are instances of Error', () => {
    expect(Errors.Unauthorized()).toBeInstanceOf(Error)
    expect(Errors.NotFound('X')).toBeInstanceOf(Error)
  })
})
