"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts"
import { Clock, Target, Award, BookOpen } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"

interface AnalyticsData {
  totalSessions: number
  totalTimeMinutes: number
  averageAccuracy: number
  currentStreak: number
  totalDecks: number
  totalCards: number
  sessionsThisWeek: any[]
  accuracyTrend: any[]
  deckPerformance: any[]
  difficultyBreakdown: any[]
  recentAchievements: any[]
}

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null)
  const [timeRange, setTimeRange] = useState("7d")
  const [loading, setLoading] = useState(true)

  const supabase = createBrowserClient()

  useEffect(() => {
    loadAnalyticsData()
  }, [timeRange])

  const loadAnalyticsData = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
      startDate.setDate(endDate.getDate() - days)

      // Get study sessions
      const { data: sessions } = await supabase
        .from("study_sessions")
        .select("*")
        .eq("user_id", user.id)
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: true })

      // Get decks
      const { data: decks } = await supabase.from("flashcard_decks").select("id, title").eq("user_id", user.id)

      // Get total cards
      const { data: cards } = await supabase.from("flashcards").select("id, difficulty").eq("user_id", user.id)

      // Process data
      const totalSessions = sessions?.length || 0
      const totalTimeMinutes = sessions?.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) || 0
      const averageAccuracy = sessions?.length
        ? sessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / sessions.length
        : 0

      // Sessions by day
      const sessionsThisWeek = Array.from({ length: 7 }, (_, i) => {
        const date = new Date()
        date.setDate(date.getDate() - (6 - i))
        const dateStr = date.toISOString().split("T")[0]
        const dayName = date.toLocaleDateString("en-US", { weekday: "short" })

        const daySessions = sessions?.filter((s) => s.created_at.startsWith(dateStr)) || []

        return {
          day: dayName,
          sessions: daySessions.length,
          accuracy:
            daySessions.length > 0
              ? daySessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / daySessions.length
              : 0,
          timeMinutes: daySessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
        }
      })

      // Accuracy trend
      const accuracyTrend =
        sessions?.slice(-10).map((session, index) => ({
          session: `Session ${index + 1}`,
          accuracy: session.accuracy || 0,
          date: new Date(session.created_at).toLocaleDateString(),
        })) || []

      // Deck performance
      const deckPerformance =
        decks
          ?.map((deck) => {
            const deckSessions = sessions?.filter((s) => s.deck_id === deck.id) || []
            const avgAccuracy =
              deckSessions.length > 0
                ? deckSessions.reduce((sum, s) => sum + (s.accuracy || 0), 0) / deckSessions.length
                : 0

            return {
              name: deck.title,
              sessions: deckSessions.length,
              accuracy: avgAccuracy,
              totalTime: deckSessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0),
            }
          })
          .filter((d) => d.sessions > 0) || []

      // Difficulty breakdown
      const difficultyBreakdown = [
        { name: "Easy", value: cards?.filter((c) => c.difficulty === "easy").length || 0, color: "#22c55e" },
        { name: "Medium", value: cards?.filter((c) => c.difficulty === "medium").length || 0, color: "#f59e0b" },
        { name: "Hard", value: cards?.filter((c) => c.difficulty === "hard").length || 0, color: "#ef4444" },
      ]

      // Calculate streak (simplified)
      const currentStreak = sessions?.length > 0 ? Math.min(sessions.length, 7) : 0

      // Mock achievements
      const recentAchievements = [
        { title: "Study Streak", description: `${currentStreak} days in a row`, icon: "🔥", earned: true },
        { title: "Quick Learner", description: "Completed 10 sessions", icon: "⚡", earned: totalSessions >= 10 },
        { title: "Accuracy Master", description: "90%+ average accuracy", icon: "🎯", earned: averageAccuracy >= 90 },
        { title: "Time Scholar", description: "5+ hours studied", icon: "⏰", earned: totalTimeMinutes >= 300 },
      ]

      setAnalyticsData({
        totalSessions,
        totalTimeMinutes,
        averageAccuracy,
        currentStreak,
        totalDecks: decks?.length || 0,
        totalCards: cards?.length || 0,
        sessionsThisWeek,
        accuracyTrend,
        deckPerformance,
        difficultyBreakdown,
        recentAchievements,
      })
    } catch (error) {
      console.error("Error loading analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || !analyticsData) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Study Analytics</h1>
          <p className="text-muted-foreground">Track your learning progress and performance</p>
        </div>
        <Select value={timeRange} onValueChange={setTimeRange}>
          <SelectTrigger className="w-32">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7d">Last 7 days</SelectItem>
            <SelectItem value="30d">Last 30 days</SelectItem>
            <SelectItem value="90d">Last 90 days</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Sessions</p>
                <p className="text-2xl font-bold">{analyticsData.totalSessions}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Time</p>
                <p className="text-2xl font-bold">
                  {Math.round(analyticsData.totalTimeMinutes / 60)}h {analyticsData.totalTimeMinutes % 60}m
                </p>
              </div>
              <Clock className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Average Accuracy</p>
                <p className="text-2xl font-bold">{Math.round(analyticsData.averageAccuracy)}%</p>
              </div>
              <Target className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Study Streak</p>
                <p className="text-2xl font-bold">{analyticsData.currentStreak} days</p>
              </div>
              <Award className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="achievements">Achievements</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Study Sessions Chart */}
            <Card>
              <CardHeader>
                <CardTitle>Daily Study Sessions</CardTitle>
                <CardDescription>Your study activity over the past week</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={analyticsData.sessionsThisWeek}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="sessions" fill="#3b82f6" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Difficulty Distribution */}
            <Card>
              <CardHeader>
                <CardTitle>Card Difficulty Distribution</CardTitle>
                <CardDescription>Breakdown of your flashcards by difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={analyticsData.difficultyBreakdown}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {analyticsData.difficultyBreakdown.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Study Time Trend */}
          <Card>
            <CardHeader>
              <CardTitle>Weekly Study Time</CardTitle>
              <CardDescription>Time spent studying each day</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analyticsData.sessionsThisWeek}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="day" />
                  <YAxis />
                  <Tooltip formatter={(value) => [`${value} min`, "Study Time"]} />
                  <Line type="monotone" dataKey="timeMinutes" stroke="#10b981" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Accuracy Trend */}
            <Card>
              <CardHeader>
                <CardTitle>Accuracy Trend</CardTitle>
                <CardDescription>Your accuracy over recent sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={analyticsData.accuracyTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="session" />
                    <YAxis domain={[0, 100]} />
                    <Tooltip formatter={(value) => [`${value}%`, "Accuracy"]} />
                    <Line type="monotone" dataKey="accuracy" stroke="#f59e0b" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Deck Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Deck Performance</CardTitle>
                <CardDescription>Performance breakdown by deck</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.deckPerformance.slice(0, 5).map((deck, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <p className="font-medium">{deck.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {deck.sessions} sessions • {deck.totalTime} min
                        </p>
                      </div>
                      <Badge
                        variant={deck.accuracy >= 80 ? "default" : deck.accuracy >= 60 ? "secondary" : "destructive"}
                      >
                        {Math.round(deck.accuracy)}%
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Your Achievements</CardTitle>
              <CardDescription>Milestones and accomplishments in your learning journey</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {analyticsData.recentAchievements.map((achievement, index) => (
                  <div
                    key={index}
                    className={`p-4 border rounded-lg ${achievement.earned ? "bg-green-50 border-green-200" : "bg-muted/50"}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="text-2xl">{achievement.icon}</div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{achievement.title}</h3>
                        <p className="text-sm text-muted-foreground">{achievement.description}</p>
                      </div>
                      {achievement.earned && <Badge variant="default">Earned</Badge>}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
