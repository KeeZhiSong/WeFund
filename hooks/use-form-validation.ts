"use client"

import { useState, useCallback } from "react"

interface ValidationRule {
  required?: boolean
  minLength?: number
  maxLength?: number
  pattern?: RegExp
  custom?: (value: any) => string | undefined
}

interface ValidationRules {
  [key: string]: ValidationRule
}

interface FormErrors {
  [key: string]: string | undefined
}

export function useFormValidation<T extends Record<string, any>>(initialValues: T, validationRules: ValidationRules) {
  const [values, setValues] = useState<T>(initialValues)
  const [errors, setErrors] = useState<FormErrors>({})
  const [touched, setTouched] = useState<Record<string, boolean>>({})

  const validateField = useCallback(
    (name: string, value: any): string | undefined => {
      const rule = validationRules[name]
      if (!rule) return undefined

      if (rule.required && (!value || (typeof value === "string" && !value.trim()))) {
        return `${name} is required`
      }

      if (typeof value === "string") {
        if (rule.minLength && value.length < rule.minLength) {
          return `${name} must be at least ${rule.minLength} characters`
        }

        if (rule.maxLength && value.length > rule.maxLength) {
          return `${name} must be less than ${rule.maxLength} characters`
        }

        if (rule.pattern && !rule.pattern.test(value)) {
          return `${name} format is invalid`
        }
      }

      if (rule.custom) {
        return rule.custom(value)
      }

      return undefined
    },
    [validationRules],
  )

  const setValue = useCallback(
    (name: string, value: any) => {
      setValues((prev) => ({ ...prev, [name]: value }))

      // Clear error when user starts typing
      if (errors[name]) {
        setErrors((prev) => ({ ...prev, [name]: undefined }))
      }
    },
    [errors],
  )

  const setFieldTouched = useCallback((name: string) => {
    setTouched((prev) => ({ ...prev, [name]: true }))
  }, [])

  const validateForm = useCallback((): boolean => {
    const newErrors: FormErrors = {}

    Object.keys(validationRules).forEach((name) => {
      const error = validateField(name, values[name])
      if (error) {
        newErrors[name] = error
      }
    })

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [values, validateField, validationRules])

  const resetForm = useCallback(() => {
    setValues(initialValues)
    setErrors({})
    setTouched({})
  }, [initialValues])

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateForm,
    resetForm,
    isValid: Object.keys(errors).length === 0,
  }
}
