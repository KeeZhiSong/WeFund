interface PasswordStrengthProps {
  password: string
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const getStrength = (password: string) => {
    let score = 0
    const checks = [
      password.length >= 8,
      /[a-z]/.test(password),
      /[A-Z]/.test(password),
      /\d/.test(password),
      /[@$!%*?&]/.test(password),
    ]

    score = checks.filter(Boolean).length
    return score
  }

  const strength = getStrength(password)
  const strengthLabels = ["Very Weak", "Weak", "Fair", "Good", "Strong"]
  const strengthColors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"]

  if (!password) return null

  return (
    <div className="mt-2">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3, 4, 5].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded-full ${level <= strength ? strengthColors[strength - 1] : "bg-gray-200"}`}
          />
        ))}
      </div>
      <p className="text-xs text-slate-600">
        Password strength: <span className="font-medium">{strengthLabels[strength - 1] || "Very Weak"}</span>
      </p>
    </div>
  )
}
