"use client"

import React, { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  ChevronLeft,
  ChevronRight,
  Monitor,
  Server,
  Layers,
  CheckCircle,
  Award,
  Calendar,
  Building2,
  Sparkles,
  Briefcase,
} from "lucide-react"
import OnboardingComplete from "./OnboardingComplete"
import { useRouter } from "next/navigation"

type OnboardingStep = 1 | 2 | 3 | 4

// Interface cho JobRole từ API
interface JobRole {
  id: string
  key: string
  title: string
  level: string
  description?: string
  category?: {
    id: string
    name: string
    skills?: string[]
  }
  specialization?: {
    id: string
    name: string
  }
}

interface FormData {
  jobRole: string
  experienceLevel: string
  skills: string[]
  firstName: string
  lastName: string
  phone: string
  department: string
  joinDate: string
  bio: string
}
interface FormErrors {
  firstName?: string
  lastName?: string
  phone?: string
  department?: string
  joinDate?: string
  jobRole?: string
  experienceLevel?: string
  skills?: string
}

export default function OnboardingSteps() {
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<OnboardingStep>(1)
  const [formData, setFormData] = useState<FormData>({
    jobRole: "",
    experienceLevel: "",
    skills: [],
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
    joinDate: new Date().toISOString().split('T')[0],
    bio: "",
  })
  const [errors, setErrors] = useState<FormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [jobRoles, setJobRoles] = useState<JobRole[]>([])
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 6
  const [isCompleted, setIsCompleted] = useState(false)

  // Fetch job roles from API
  useEffect(() => {
    const fetchJobRoles = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/positions')
        if (response.ok) {
          const data = await response.json()
          setJobRoles(data)
        } else {
          console.error('Failed to fetch job roles')
        }
      } catch (error) {
        console.error('Error fetching job roles:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchJobRoles()
  }, [])

  // Fetch user profile data to pre-fill firstName and lastName
  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const response = await fetch('/api/user/current')
        if (response.ok) {
          const userData = await response.json()
          if (userData) {
            setFormData(prev => ({
              ...prev,
              firstName: userData.firstName || '',
              lastName: userData.lastName || '',
              phone: userData.phone || '',
              bio: userData.bio || '',
              department: userData.department || ''
            }))
          }
        }
      } catch (error) {
        console.error('Error fetching user profile:', error)
      }
    }

    fetchUserProfile()
  }, [])

  // Pagination logic
  const totalPages = Math.ceil(jobRoles.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentJobRoles = jobRoles.slice(startIndex, endIndex)

  // Tạo experience levels động từ JobRole.level của role đã chọn
  const experienceLevels = React.useMemo(() => {
    // Chỉ hiển thị 3 levels tương ứng với database enum ExperienceLevel
    const allLevels = [
      { id: "junior", title: "Junior Level", description: "Building foundational skills and gaining hands-on experience", years: "1-3 years of experience" },
      { id: "mid", title: "Mid-Level", description: "Developing expertise and taking on complex technical challenges", years: "3-5 years of experience" },
      { id: "senior", title: "Senior Level", description: "Leading technical decisions and mentoring development teams", years: "5+ years of experience" },
    ]

    // Nếu đã chọn job role, highlight level của role đó
    if (formData.jobRole) {
      const selectedRole = jobRoles.find(role => role.id === formData.jobRole)
      if (selectedRole) {
        console.log(`🎯 Job Role "${selectedRole.title}" has level: ${selectedRole.level}`)
        
        // Cập nhật description để chỉ ra level được recommend
        return allLevels.map(level => ({
          ...level,
          description: level.id === selectedRole.level 
            ? `${level.description} (Recommended for your role)`
            : level.description
        }))
      }
    }

    return allLevels
  }, [formData.jobRole, jobRoles])

  // Tạo suggested skills từ tất cả JobCategory.skills
  const suggestedSkills = React.useMemo(() => {
    const allSkills = new Set<string>()
    
    jobRoles.forEach(role => {
      if (role.category?.skills) {
        role.category.skills.forEach(skill => allSkills.add(skill))
      }
    })
    
    // Fallback skills nếu không có skills từ category
    if (allSkills.size === 0) {
      return [
        "React", "TypeScript", "JavaScript", "Node.js", "Python", "Java",
        "SQL", "Docker", "AWS", "Git", "HTML", "CSS", "GitHub"
      ]
    }
    
    return Array.from(allSkills).sort()
  }, [jobRoles])

  // Get icon based on job role key or category
  const getJobRoleIcon = (jobRole: JobRole) => {
    const key = jobRole.key?.toLowerCase() || ''
    const categoryName = jobRole.category?.name?.toLowerCase() || ''
    
    if (key.includes('frontend') || categoryName.includes('frontend')) return Monitor
    if (key.includes('backend') || categoryName.includes('backend')) return Server
    if (key.includes('fullstack') || categoryName.includes('fullstack')) return Layers
    if (key.includes('devops') || categoryName.includes('devops')) return Building2
    if (key.includes('mobile') || categoryName.includes('mobile')) return Monitor
    if (key.includes('data') || categoryName.includes('data')) return Server
    if (key.includes('ai') || key.includes('ml') || categoryName.includes('ai')) return Layers
    if (key.includes('security') || categoryName.includes('security')) return Building2
    if (key.includes('ui') || key.includes('ux') || categoryName.includes('design')) return Monitor
    if (key.includes('qa') || key.includes('test') || categoryName.includes('testing')) return Server
    if (key.includes('product') || categoryName.includes('product')) return Layers
    if (key.includes('cloud') || categoryName.includes('cloud')) return Building2
    if (key.includes('blockchain') || categoryName.includes('blockchain')) return Monitor
    if (key.includes('game') || categoryName.includes('game')) return Server
    if (key.includes('embedded') || categoryName.includes('embedded')) return Layers
    if (key.includes('network') || categoryName.includes('network')) return Building2
    if (key.includes('database') || categoryName.includes('database')) return Monitor
    if (key.includes('site') || key.includes('reliability') || categoryName.includes('reliability')) return Server
    if (key.includes('technical') || key.includes('writer') || categoryName.includes('documentation')) return Layers
    if (key.includes('data') || key.includes('scientist') || categoryName.includes('analytics')) return Building2
    
    return Briefcase // Default icon
  }

  // Get skills for a job role - ưu tiên từ JobCategory.skills
  const getJobRoleSkills = (jobRole: JobRole): string[] => {
    // Ưu tiên skills từ category (JobCategory.skills)
    if (jobRole.category?.skills && jobRole.category.skills.length > 0) {
      return jobRole.category.skills
    }
    
    // Fallback: tạo skills dựa trên tên role
    const key = jobRole.key?.toLowerCase() || ''
    const categoryName = jobRole.category?.name?.toLowerCase() || ''
    
    if (key.includes('frontend') || categoryName.includes('frontend')) {
      return ["React", "TypeScript", "CSS", "HTML", "JavaScript", "Vue.js", "Angular"]
    }
    if (key.includes('backend') || categoryName.includes('backend')) {
      return ["Node.js", "Python", "Java", "SQL", "Docker", "Express", "NestJS"]
    }
    if (key.includes('fullstack') || categoryName.includes('fullstack')) {
      return ["React", "Node.js", "TypeScript", "PostgreSQL", "AWS", "Next.js"]
    }
    if (key.includes('devops') || categoryName.includes('devops')) {
      return ["Docker", "Kubernetes", "AWS", "Jenkins", "Terraform", "CI/CD"]
    }
    if (key.includes('mobile') || categoryName.includes('mobile')) {
      return ["React Native", "Flutter", "Swift", "Kotlin", "Firebase"]
    }
    if (key.includes('data') || categoryName.includes('data')) {
      return ["Python", "SQL", "Spark", "Airflow", "AWS", "Pandas", "NumPy"]
    }
    if (key.includes('ai') || key.includes('ml') || categoryName.includes('ai')) {
      return ["Python", "TensorFlow", "PyTorch", "Scikit-learn", "AWS", "Machine Learning"]
    }
    
    // Fallback cuối cùng: lấy từ suggestedSkills
    return suggestedSkills.slice(0, 10)
  }

  // Get levels for a job role
  const getJobRoleLevels = (jobRole: JobRole): string[] => {
    const level = jobRole.level?.toLowerCase() || ''
    
    if (level.includes('junior')) return ["Junior"]
    if (level.includes('mid') || level.includes('intermediate')) return ["Mid-Level"]
    if (level.includes('senior')) return ["Senior"]
    if (level.includes('lead')) return ["Lead"]
    if (level.includes('principal')) return ["Principal"]
    
    // Default levels
    return ["Junior", "Mid-Level", "Senior"]
  }

  const handleInputChange = (field: keyof FormData, value: string | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear errors when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }))
    }

    // Khi chọn job role, tự động set experience level từ JobRole.level
    if (field === 'jobRole' && typeof value === 'string') {
      const selectedRole = jobRoles.find(role => role.id === value)
      if (selectedRole) {
        console.log(`🎯 Auto-setting experience level to: ${selectedRole.level}`)
        setFormData(prev => ({ ...prev, experienceLevel: selectedRole.level }))
        
        // Auto-scroll xuống bottom sau khi chọn job role
        setTimeout(() => {
          window.scrollTo({
            top: document.documentElement.scrollHeight,
            behavior: 'smooth'
          })
        }, 300)
      }
    }
  }

  const addSkill = (skill: string) => {
    if (!formData.skills.includes(skill)) {
      setFormData(prev => ({ ...prev, skills: [...prev.skills, skill] }))
    }
  }

  const removeSkill = (skill: string) => {
    setFormData(prev => ({ ...prev, skills: prev.skills.filter(s => s !== skill) }))
  }

  const validateStep = (step: OnboardingStep): boolean => {
    const newErrors: FormErrors = {}

    switch (step) {
      case 1:
        if (!formData.jobRole) {
          newErrors.jobRole = "Please select a job role"
        }
        break
      case 2:
        if (!formData.experienceLevel) {
          newErrors.experienceLevel = "Please select your experience level"
        }
        break
      case 3:
        if (formData.skills.length === 0) {
          newErrors.skills = "Please select at least one skill"
        }
        break
                           case 4:
                // Chỉ validate firstName và lastName nếu user chưa có sẵn
                if (!formData.firstName && !formData.lastName) {
                  newErrors.firstName = "First name or last name is required"
                }
                if (!formData.phone) newErrors.phone = "Phone number is required"
                if (!formData.department) newErrors.department = "Department is required"
                if (!formData.joinDate) newErrors.joinDate = "Join date is required"
                break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const nextStep = () => {
    if (validateStep(currentStep)) {
      if (currentStep < 4) {
        setCurrentStep(prev => (prev + 1) as OnboardingStep)
        
        // Auto-scroll lên đầu step mới
        setTimeout(() => {
          window.scrollTo({
            top: 0,
            behavior: 'smooth'
          })
        }, 100)
      } else {
        handleSubmit()
      }
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => (prev - 1) as OnboardingStep)
    }
  }

  const handleSubmit = async () => {
    if (!validateStep(4)) return

    setIsSubmitting(true)
    try {
      // Chuẩn bị data để submit
      const submitData = {
        ...formData,
        // Đảm bảo skills được lưu vào User.skills
        skills: formData.skills,
        // Map experience level từ UI sang database enum
        experienceLevel: formData.experienceLevel.toLowerCase() as 'junior' | 'mid' | 'senior'
      }

      // Submit onboarding data step by step
      // Step 1: Job Role
      if (formData.jobRole) {
        const jobRoleResponse = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 'job-role',
            data: { jobRoleId: formData.jobRole }
          }),
        })
        if (!jobRoleResponse.ok) {
          console.error('❌ Failed to submit job role')
          return
        }
      }

      // Step 2: Experience Level
      if (formData.experienceLevel) {
        const experienceResponse = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 'experience',
            data: { experienceLevel: formData.experienceLevel.toLowerCase() as 'junior' | 'mid' | 'senior' }
          }),
        })
        if (!experienceResponse.ok) {
          console.error('❌ Failed to submit experience level')
          return
        }
      }

      // Step 3: Skills
      if (formData.skills && formData.skills.length > 0) {
        const skillsResponse = await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            step: 'skills',
            data: { skills: formData.skills }
          }),
        })
        if (!skillsResponse.ok) {
          console.error('❌ Failed to submit skills')
          return
        }
      }

      // Step 4: Profile
      const profileResponse = await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          step: 'profile',
          data: {
            firstName: formData.firstName || '',
            lastName: formData.lastName || '',
            phone: formData.phone || '',
            bio: formData.bio || '',
            department: formData.department || '',
            joinDate: formData.joinDate || ''
          }
        }),
      })

      if (profileResponse.ok) {
        console.log('✅ Onboarding completed successfully!')
        console.log('📝 Skills saved:', formData.skills)
        console.log('🎯 Job Role:', formData.jobRole)
        console.log('📊 Experience Level:', formData.experienceLevel)
        
        // Set completed state instead of redirecting immediately
        setIsCompleted(true)
      } else {
        console.error('❌ Failed to submit profile data')
      }
    } catch (error) {
      console.error('❌ Error submitting onboarding data:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const progress = (currentStep / 4) * 100

  // Show completion screen if onboarding is completed
  if (isCompleted) {
    return <OnboardingComplete onContinue={() => {
      // Set flag to show streak popup after onboarding completion
      localStorage.setItem('showStreakReminderAfterOnboarding', '1')
      router.push('/dashboard')
    }} />
  }
       if (loading) {
         return (
           <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 magical-bg flex items-center justify-center">
             <div className="text-center">
               <div className="animate-spin rounded-full h-12 w-12 border-b-4 border-primary mx-auto shadow-2xl animate-pulse-glow"></div>
               <p className="mt-4 text-foreground text-lg font-semibold">Loading job roles...</p>
             </div>
           </div>
         )
       }

     return (
     <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-secondary/10 magical-bg flex items-center justify-center p-4">
       <div className="w-full max-w-4xl">
         <Card className="shadow-2xl border-0 bg-card/95 backdrop-blur-sm animate-fade-in-up overflow-hidden">
           <CardContent className="p-12">
             <div className="text-center mb-12">
               <h1 className="text-4xl font-bold text-foreground mb-6 font-mono bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent animate-gradient animate-float">
                 Welcome to the Team!
               </h1>
               <p className="text-muted-foreground text-lg animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                 Let's set up your professional profile in just a few steps
               </p>
             </div>

                         <div className="mb-12">
               <div className="flex justify-between items-center mb-6">
                 <span className="text-base font-semibold text-muted-foreground animate-slide-in-left">
                   Step {currentStep} of 4
                 </span>
                 <span className="text-base font-bold text-primary bg-gradient-to-r from-primary/20 to-secondary/20 px-4 py-2 rounded-full border border-primary/30 animate-pulse-glow animate-slide-in-right">
                   {Math.round(progress)}% Complete
                 </span>
               </div>
               <div className="relative">
                 <Progress value={progress} className="h-4 bg-muted shadow-inner rounded-full overflow-hidden" />
                 <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full"></div>
               </div>
             </div>

            {/* Step Indicators (static labels, no animation) */}
            <div className="flex items-center justify-center mb-8">
              {[
                { step: 1, label: "Role" },
                { step: 2, label: "Experience" },
                { step: 3, label: "Skills" },
                { step: 4, label: "Profile" }
              ].map(({ step, label }, index) => (
                <div key={step} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                        w-12 h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-700 border-2 relative animate-float
                        ${
                          step <= currentStep
                            ? "bg-gradient-to-br from-primary to-secondary text-white border-primary shadow-2xl animate-pulse-glow"
                            : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:scale-110"
                        }
                      `}
                      style={{ animationDelay: `${index * 0.5}s` }}
                    >
                      {step < currentStep ? (
                        <CheckCircle className="w-6 h-6 animate-scale-in" />
                      ) : step === currentStep ? (
                        <Sparkles className="w-6 h-6 animate-spin" />
                      ) : (
                        step
                      )}
                      {step === currentStep && (
                        <>
                          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping opacity-75"></div>
                          <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary/20 to-secondary/20 animate-pulse"></div>
                        </>
                      )}
                    </div>
                    <span
                      className={`text-xs mt-3 font-bold ${
                        step <= currentStep ? "text-primary" : "text-muted-foreground"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {index < 3 && (
                    <div
                      className={`
                        w-20 h-1.5 mx-6 mt-[-18px] transition-all duration-700 rounded-full relative overflow-hidden
                        ${step < currentStep ? "bg-gradient-to-r from-primary via-secondary to-accent animate-gradient" : "bg-border"}
                      `}
                    >
                      {step < currentStep && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer rounded-full"></div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

                         {/* Step Content */}
             <div className="mb-12">
                      {currentStep === 1 && (
              <div className="space-y-6 animate-fade-in-up">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    Choose Your Role
                  </h2>
                  <p className="text-muted-foreground text-lg">Select your primary area of expertise</p>
                </div>

                                                           <div className="grid gap-6">
                  {currentJobRoles.map((role, index) => {
                    const IconComponent = getJobRoleIcon(role)
                    const roleSkills = getJobRoleSkills(role)
                    const roleLevels = getJobRoleLevels(role)
                    
                    return (
                      <Card
                        key={role.id}
                        className={`cursor-pointer card-hover border-2 ${
                          formData.jobRole === role.id
                            ? "ring-4 ring-primary/30 border-primary bg-gradient-to-br from-primary/10 to-secondary/5 shadow-2xl animate-pulse-glow"
                            : "border-border hover:border-primary/50 hover:bg-primary/5"
                        }`}
                        onClick={() => handleInputChange("jobRole", role.id)}
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start space-x-6">
                            <div
                              className={`p-4 rounded-xl transition-all duration-300 ${
                                formData.jobRole === role.id
                                  ? "bg-gradient-to-br from-primary to-secondary text-white shadow-lg animate-pulse"
                                  : "bg-primary/10 text-primary hover:bg-primary/20"
                              }`}
                            >
                              <IconComponent className="w-8 h-8" />
                            </div>
                            <div className="flex-1">
                              <h3 className="font-bold text-xl mb-2 font-mono">{role.title}</h3>
                              <p className="text-muted-foreground mb-4 leading-relaxed text-base">
                                {role.description || "No description available"}
                              </p>
                              <div className="flex flex-wrap gap-2 mb-3">
                                {roleLevels.map((level) => (
                                  <Badge key={level} variant="secondary" className="text-xs font-semibold py-1 px-2">
                                     {level}
                                  </Badge>
                                ))}
                              </div>
                              <div className="flex flex-wrap gap-2">
                                {roleSkills.slice(0, 6).map((skill) => (
                                  <Badge key={skill} variant="outline" className="text-xs skill-badge">
                                    {skill}
                                  </Badge>
                                ))}
                                {roleSkills.length > 6 && (
                                  <Badge variant="outline" className="text-xs skill-badge">
                                    +{roleSkills.length - 6} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )
                  })}
                </div>

                                                                            {/* Pagination */}
                 {totalPages > 1 && (
                   <div className="flex justify-center items-center gap-3 mt-8">
                     <Button
                       variant="outline"
                       size="default"
                       onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                       disabled={currentPage === 1}
                       className="border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 px-6 py-2"
                     >
                       <ChevronLeft className="w-4 h-4 mr-2" />
                       Previous
                     </Button>
                     
                     <div className="flex gap-2">
                       {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                         <Button
                           key={page}
                           variant={currentPage === page ? "default" : "outline"}
                           size="default"
                           onClick={() => setCurrentPage(page)}
                           className={`w-10 h-10 p-0 transition-all duration-300 font-bold ${
                             currentPage === page 
                               ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg" 
                               : "border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary"
                           }`}
                         >
                           {page}
                         </Button>
                       ))}
                     </div>
 
                     <Button
                       variant="outline"
                       size="default"
                       onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                       disabled={currentPage === totalPages}
                       className="border-2 border-primary/30 text-primary hover:bg-primary/10 hover:border-primary transition-all duration-300 px-6 py-2"
                     >
                       Next
                       <ChevronRight className="w-4 h-4 ml-2" />
                     </Button>
                   </div>
                 )}
            </div>
          )}

                                                                                                                                                                               {currentStep === 2 && (
                <div className="space-y-6 animate-slide-in-right">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Experience Level
                    </h2>
                                         <p className="text-muted-foreground text-lg">
                       What's your current professional level?
                     </p>
                    
                    
                  </div>

                                                                                                                                   <div className="grid md:grid-cols-3 gap-6">
                     {experienceLevels.map((level, index) => {
                       const selectedRole = jobRoles.find(role => role.id === formData.jobRole)
                       const isRecommended = selectedRole && level.id === selectedRole.level
                       const isSelected = formData.experienceLevel === level.id
                       
                       return (
                         <Card
                           key={level.id}
                           className={`cursor-pointer card-hover border-2 transition-all duration-300 ${
                             isSelected
                               ? "ring-4 ring-primary/30 border-primary bg-gradient-to-br from-primary/10 to-secondary/5 shadow-2xl animate-pulse-glow scale-105"
                               : isRecommended
                               ? "ring-2 ring-green-400 border-green-500 bg-gradient-to-br from-green-500/10 to-emerald-500/5 shadow-lg hover:scale-105 hover:shadow-xl"
                               : "border-border hover:border-primary/50 hover:bg-primary/5 hover:scale-105"
                           }`}
                                                      onClick={() => {
                              handleInputChange("experienceLevel", level.id)
                              // Auto-scroll xuống bottom sau khi chọn experience level
                              setTimeout(() => {
                                window.scrollTo({
                                  top: document.documentElement.scrollHeight,
                                  behavior: 'smooth'
                                })
                              }, 300)
                            }}
                            style={{ animationDelay: `${index * 0.2}s` }}
                          >
                           <CardContent className="p-6 text-center">
                             <div className="mb-6">
                               <Award
                                 className={`w-12 h-12 mx-auto transition-all duration-300 ${
                                   isSelected
                                     ? "text-primary animate-bounce"
                                     : isRecommended
                                     ? "text-green-500"
                                     : "text-muted-foreground hover:text-primary"
                                 }`}
                               />
                             </div>
                             <h3 className="font-bold text-xl mb-3 font-mono">{level.title}</h3>
                             <p className="text-primary font-bold mb-3 text-base">{level.years}</p>
                             <p className="text-muted-foreground leading-relaxed text-sm">{level.description}</p>
                             
                             
                           </CardContent>
                         </Card>
                       )
                     })}
                   </div>
            </div>
          )}

                                                                                       {currentStep === 3 && (
               <div className="space-y-6 animate-fade-in-up">
                 <div className="text-center">
                   <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                     Technical Skills
                   </h2>
                   <p className="text-muted-foreground text-lg">Select your areas of expertise</p>
                 </div>

                                                           <div className="space-y-6">
                  <div>
                    <Label htmlFor="skills" className="text-base font-bold mb-4 block">
                      {formData.jobRole 
                        ? `Popular skills for ${jobRoles.find(j => j.id === formData.jobRole)?.title || 'your role'}`
                        : "Choose from popular technologies"
                      }
                    </Label>
                   
                   {(() => {
                     const selectedRole = jobRoles.find(j => j.id === formData.jobRole)
                     
                     // Ưu tiên skills từ JobCategory.skills của role đã chọn
                     let skillsSource: string[]
                     if (selectedRole && selectedRole.category?.skills && selectedRole.category.skills.length > 0) {
                       skillsSource = selectedRole.category.skills
                       console.log(`🎯 Using skills from ${selectedRole.category.name}:`, skillsSource)
                     } else if (selectedRole) {
                       skillsSource = getJobRoleSkills(selectedRole)
                       console.log(`🔄 Using fallback skills for ${selectedRole.title}:`, skillsSource)
                     } else {
                       skillsSource = suggestedSkills
                       console.log(`📚 Using general suggested skills:`, skillsSource)
                     }
                     
                                           return (
                        <div className="flex flex-wrap gap-3 max-h-[250px] overflow-y-auto">
                          {skillsSource.map((skill, index) => (
                            <Badge
                              key={skill}
                              variant={formData.skills.includes(skill) ? "default" : "outline"}
                              className={`cursor-pointer skill-badge text-xs py-2 px-4 font-semibold transition-all duration-300 hover:scale-105 ${
                                formData.skills.includes(skill)
                                  ? "bg-gradient-to-r from-primary to-secondary text-white shadow-lg animate-pulse-glow"
                                  : "hover:border-primary/50 hover:bg-primary/10 hover:text-primary"
                              }`}
                                                           onClick={() => {
                                formData.skills.includes(skill) ? removeSkill(skill) : addSkill(skill)
                                // Auto-scroll xuống bottom sau khi chọn skill
                                setTimeout(() => {
                                  window.scrollTo({
                                    top: document.documentElement.scrollHeight,
                                    behavior: 'smooth'
                                  })
                                }, 300)
                              }}
                              style={{ animationDelay: `${index * 0.05}s` }}
                            >
                             {skill}
                           </Badge>
                         ))}
                       </div>
                     )
                   })()}
                 </div>

                                                  {formData.skills.length > 0 && (
                   <div className="bg-gradient-to-br from-primary/10 to-secondary/5 rounded-2xl p-8 border-2 border-primary/20 shadow-xl animate-fade-in-up">
                     <Label className="text-lg font-bold mb-6 block text-primary flex items-center gap-2">
                       <Sparkles className="w-5 h-5 animate-pulse" />
                       Selected Skills ({formData.skills.length})
                     </Label>
                     <div className="flex flex-wrap gap-4">
                       {formData.skills.map((skill, index) => (
                         <Badge
                           key={skill}
                           className="bg-gradient-to-r from-primary to-secondary text-white text-sm py-3 px-5 font-semibold shadow-lg animate-fade-in-up"
                           style={{ animationDelay: `${index * 0.1}s` }}
                         >
                           {skill}
                           <button
                             onClick={() => removeSkill(skill)}
                             className="ml-3 hover:bg-white/20 rounded-full p-1 transition-all duration-200 hover:scale-110"
                           >
                             ×
                           </button>
                         </Badge>
                       ))}
                     </div>
                   </div>
                 )}
              </div>
            </div>
          )}

                                                                                                                                                                               {currentStep === 4 && (
                <div className="space-y-6 animate-slide-in-right">
                  <div className="text-center">
                    <h2 className="text-3xl font-bold text-foreground mb-3 font-mono bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      Professional Profile
                    </h2>
                    <p className="text-muted-foreground text-lg">Complete your professional information</p>
                    
                    
                  </div>

                                            <div className="space-y-8">
                 <div className="grid md:grid-cols-2 gap-8">
                   <div className="animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
                     <Label htmlFor="firstName" className="text-base font-bold">
                       First Name 
                       {formData.firstName && (
                         <span className="text-green-600 text-sm ml-2">✓ Pre-filled from profile</span>
                       )}
                     </Label>
                     <Input
                       id="firstName"
                       value={formData.firstName}
                       onChange={(e) => handleInputChange("firstName", e.target.value)}
                       placeholder="Enter your first name"
                       className={`mt-3 h-14 text-lg border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 ${
                         errors.firstName ? "border-red-500" : ""
                       } ${formData.firstName ? "bg-green-50 border-green-500" : ""}`}
                     />
                     {errors.firstName && (
                       <p className="text-red-500 text-sm mt-2">{errors.firstName}</p>
                     )}
                   </div>

                   <div className="animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
                     <Label htmlFor="lastName" className="text-base font-bold">
                       Last Name
                       {formData.lastName && (
                         <span className="text-green-600 text-sm ml-2">✓ Pre-filled from profile</span>
                       )}
                     </Label>
                     <Input
                       id="lastName"
                       value={formData.lastName}
                       onChange={(e) => handleInputChange("lastName", e.target.value)}
                       placeholder="Enter your last name"
                       className={`mt-3 h-14 text-lg border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 ${
                         errors.lastName ? "border-red-500" : ""
                       } ${formData.lastName ? "bg-green-50 border-green-500" : ""}`}
                     />
                     {errors.lastName && (
                       <p className="text-red-500 text-sm mt-2">{errors.lastName}</p>
                     )}
                   </div>
                 </div>

                 <div className="animate-fade-in-up" style={{ animationDelay: "0.3s" }}>
                   <Label htmlFor="phone" className="text-base font-bold">Phone Number</Label>
                   <Input
                     id="phone"
                     value={formData.phone}
                     onChange={(e) => handleInputChange("phone", e.target.value)}
                     placeholder="Enter your phone number"
                     className={`mt-3 h-14 text-lg border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 ${
                       errors.phone ? "border-red-500" : ""
                     }`}
                   />
                   {errors.phone && (
                     <p className="text-red-500 text-sm mt-2">{errors.phone}</p>
                   )}
                 </div>

                 <div className="animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
                   <Label htmlFor="department" className="text-base font-bold">Department</Label>
                   <Input
                     id="department"
                     value={formData.department}
                     onChange={(e) => handleInputChange("department", e.target.value)}
                     placeholder="e.g., Engineering, Product, Design"
                     className={`mt-3 h-14 text-lg border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 ${
                       errors.department ? "border-red-500" : ""
                     }`}
                   />
                   {errors.department && (
                     <p className="text-red-500 text-sm mt-2">{errors.department}</p>
                   )}
                 </div>

                 <div className="animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
                   <Label htmlFor="joinDate" className="text-base font-bold">Start Date</Label>
                   <div className="relative mt-3">
                     <Input
                       id="joinDate"
                       type="date"
                       value={formData.joinDate}
                       onChange={(e) => handleInputChange("joinDate", e.target.value)}
                       className={`h-14 text-lg border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 ${
                         errors.joinDate ? "border-red-500" : ""
                       }`}
                     />
                     <Calendar className="absolute right-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-muted-foreground pointer-events-none" />
                   </div>
                   {errors.joinDate && (
                     <p className="text-red-500 text-sm mt-2">{errors.joinDate}</p>
                   )}
                 </div>
               </div>

                                              <div className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
                   <Label htmlFor="bio" className="text-base font-bold">Professional Bio</Label>
                   <Textarea
                     id="bio"
                     value={formData.bio}
                     onChange={(e) => handleInputChange("bio", e.target.value)}
                     placeholder="Brief introduction about your professional background and interests..."
                     rows={5}
                     className="mt-3 resize-none text-lg border-2 focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300"
                   />
                 </div>
            </div>
          )}
        </div>

                                                                             {/* Navigation Buttons */}
             <div className="flex justify-between">
               <Button
                 variant="outline"
                 onClick={prevStep}
                 disabled={currentStep === 1}
                 className="flex items-center gap-3 h-12 px-8 font-bold text-lg bg-transparent border-2 hover:bg-primary/10 hover:border-primary transition-all duration-300 hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 btn-magical"
               >
                 <ChevronLeft className="w-5 h-5" />
                 Back
               </Button>
 
               <Button
                 onClick={nextStep}
                 disabled={isSubmitting}
                 className="flex items-center gap-3 h-12 px-10 font-bold text-lg bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 hover:scale-105 shadow-2xl hover:shadow-3xl disabled:opacity-50 disabled:hover:scale-100 btn-magical animate-pulse-glow"
               >
                 {currentStep === 4 ? (
                   <>
                     {isSubmitting ? "Submitting..." : "Complete Setup"}
                     <Sparkles className="w-5 h-5" />
                   </>
                 ) : (
                   <>
                     Continue
                     <ChevronRight className="w-5 h-5" />
                   </>
                 )}
               </Button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
