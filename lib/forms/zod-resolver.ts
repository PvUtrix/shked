import { toNestErrors, validateFieldsNatively } from '@hookform/resolvers'
import type { FieldError, FieldErrors, FieldValues, Resolver } from 'react-hook-form'
import type { z } from 'zod'

/**
 * react-hook-form resolver for Zod 4.
 *
 * @hookform/resolvers 3.9 recognises a Zod error by its `errors` array, which
 * Zod 4 renamed to `issues`, so its zodResolver rethrew every validation
 * failure instead of showing it on the field (every form crashed on invalid
 * input). This adapter keeps the 3.9 call signature, and like 3.9 it takes the
 * field-value type from the useForm call, so forms only change their import.
 * Replace it with @hookform/resolvers 5 once the forms' input and output
 * types are tidied up.
 */
export function zodResolver<TFieldValues extends FieldValues = FieldValues>(
  schema: z.ZodType
): Resolver<TFieldValues> {
  return async (values, _context, options) => {
    const result = await schema.safeParseAsync(values)

    if (result.success) {
      if (options.shouldUseNativeValidation) validateFieldsNatively({}, options)
      return { values: result.data as TFieldValues, errors: {} }
    }

    const errors: Record<string, FieldError> = {}
    for (const issue of result.error.issues) {
      const path = issue.path.join('.')
      // Keep the first message per field, like the 3.9 resolver.
      if (!errors[path]) errors[path] = { type: issue.code, message: issue.message }
    }
    return { values: {}, errors: toNestErrors(errors as FieldErrors, options) }
  }
}
