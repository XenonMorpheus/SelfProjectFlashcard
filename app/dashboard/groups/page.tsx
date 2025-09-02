"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Users, Plus, Trophy } from "lucide-react"
import { createBrowserClient } from "@/lib/supabase/client"
import Link from "next/link"

interface StudyGroup {
  id: string
  name: string
  description: string
  member_count: number
  is_public: boolean
  created_by: string
  join_code: string
  created_at: string
}

interface GroupMember {
  id: string
  user_id: string
  role: string
  joined_at: string
  profile: {
    full_name: string
  }
}

export default function GroupsPage() {
  const [myGroups, setMyGroups] = useState<StudyGroup[]>([])
  const [publicGroups, setPublicGroups] = useState<StudyGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [joinCode, setJoinCode] = useState("")

  const [newGroup, setNewGroup] = useState({
    name: "",
    description: "",
    is_public: true,
  })

  const supabase = createBrowserClient()

  useEffect(() => {
    loadGroups()
  }, [])

  const loadGroups = async () => {
    setLoading(true)
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      // Get groups user is a member of
      const { data: memberGroups } = await supabase
        .from("study_group_members")
        .select(`
          study_groups (
            id,
            name,
            description,
            is_public,
            created_by,
            join_code,
            created_at
          )
        `)
        .eq("user_id", user.id)

      // Get member counts for user's groups
      const myGroupsWithCounts = await Promise.all(
        (memberGroups || []).map(async (item) => {
          const group = item.study_groups
          if (!group) return null

          const { count } = await supabase
            .from("study_group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)

          return {
            ...group,
            member_count: count || 0,
          }
        }),
      )

      setMyGroups(myGroupsWithCounts.filter(Boolean) as StudyGroup[])

      // Get public groups (excluding ones user is already in)
      const userGroupIds = myGroupsWithCounts.map((g) => g?.id).filter(Boolean)

      let publicQuery = supabase.from("study_groups").select("*").eq("is_public", true)

      if (userGroupIds.length > 0) {
        publicQuery = publicQuery.not("id", "in", `(${userGroupIds.join(",")})`)
      }

      const { data: publicGroupsData } = await publicQuery.limit(10)

      // Get member counts for public groups
      const publicGroupsWithCounts = await Promise.all(
        (publicGroupsData || []).map(async (group) => {
          const { count } = await supabase
            .from("study_group_members")
            .select("*", { count: "exact", head: true })
            .eq("group_id", group.id)

          return {
            ...group,
            member_count: count || 0,
          }
        }),
      )

      setPublicGroups(publicGroupsWithCounts)
    } catch (error) {
      console.error("Error loading groups:", error)
    } finally {
      setLoading(false)
    }
  }

  const createGroup = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const joinCode = Math.random().toString(36).substring(2, 10).toUpperCase()

      const { data: group, error } = await supabase
        .from("study_groups")
        .insert({
          name: newGroup.name,
          description: newGroup.description,
          is_public: newGroup.is_public,
          created_by: user.id,
          join_code: joinCode,
        })
        .select()
        .single()

      if (error) throw error

      // Add creator as admin member
      await supabase.from("study_group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "admin",
      })

      setCreateDialogOpen(false)
      setNewGroup({ name: "", description: "", is_public: true })
      loadGroups()
    } catch (error) {
      console.error("Error creating group:", error)
    }
  }

  const joinGroup = async (groupId: string) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      await supabase.from("study_group_members").insert({
        group_id: groupId,
        user_id: user.id,
        role: "member",
      })

      loadGroups()
    } catch (error) {
      console.error("Error joining group:", error)
    }
  }

  const joinByCode = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) return

      const { data: group } = await supabase
        .from("study_groups")
        .select("id")
        .eq("join_code", joinCode.toUpperCase())
        .single()

      if (!group) {
        alert("Invalid join code")
        return
      }

      await supabase.from("study_group_members").insert({
        group_id: group.id,
        user_id: user.id,
        role: "member",
      })

      setJoinCode("")
      loadGroups()
    } catch (error) {
      console.error("Error joining by code:", error)
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Study Groups</h1>
          <p className="text-muted-foreground">Join study groups to learn together and compete on leaderboards</p>
        </div>
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline">Join by Code</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Join Group by Code</DialogTitle>
                <DialogDescription>Enter the group join code to join a private study group</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="join-code">Join Code</Label>
                  <Input
                    id="join-code"
                    placeholder="Enter 8-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    maxLength={8}
                  />
                </div>
                <Button onClick={joinByCode} disabled={joinCode.length !== 8}>
                  Join Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Group
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Study Group</DialogTitle>
                <DialogDescription>Create a new study group to collaborate with others</DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="group-name">Group Name</Label>
                  <Input
                    id="group-name"
                    placeholder="Enter group name"
                    value={newGroup.name}
                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="group-description">Description</Label>
                  <Textarea
                    id="group-description"
                    placeholder="Describe your study group"
                    value={newGroup.description}
                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <Switch
                    id="public-group"
                    checked={newGroup.is_public}
                    onCheckedChange={(checked) => setNewGroup({ ...newGroup, is_public: checked })}
                  />
                  <Label htmlFor="public-group">Make group public</Label>
                </div>
                <Button onClick={createGroup} disabled={!newGroup.name.trim()}>
                  Create Group
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="my-groups" className="space-y-6">
        <TabsList>
          <TabsTrigger value="my-groups">My Groups ({myGroups.length})</TabsTrigger>
          <TabsTrigger value="discover">Discover Groups</TabsTrigger>
        </TabsList>

        <TabsContent value="my-groups" className="space-y-6">
          {myGroups.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myGroups.map((group) => (
                <Card key={group.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-lg">{group.name}</CardTitle>
                        <CardDescription className="line-clamp-2 mt-1">
                          {group.description || "No description provided"}
                        </CardDescription>
                      </div>
                      {!group.is_public && <Badge variant="secondary">Private</Badge>}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        <span>{group.member_count} members</span>
                      </div>
                      <span>Code: {group.join_code}</span>
                    </div>
                    <div className="flex gap-2">
                      <Button asChild variant="outline" size="sm" className="flex-1 bg-transparent">
                        <Link href={`/dashboard/groups/${group.id}`}>
                          <Users className="h-4 w-4 mr-2" />
                          View Group
                        </Link>
                      </Button>
                      <Button asChild size="sm" className="flex-1">
                        <Link href={`/dashboard/groups/${group.id}/leaderboard`}>
                          <Trophy className="h-4 w-4 mr-2" />
                          Leaderboard
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No study groups yet</CardTitle>
                <CardDescription className="mb-4">
                  Create or join a study group to start collaborating with others
                </CardDescription>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Group
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="discover" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {publicGroups.map((group) => (
              <Card key={group.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-lg">{group.name}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {group.description || "No description provided"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      <span>{group.member_count} members</span>
                    </div>
                    <Badge variant="outline">Public</Badge>
                  </div>
                  <Button onClick={() => joinGroup(group.id)} className="w-full">
                    <Plus className="h-4 w-4 mr-2" />
                    Join Group
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>

          {publicGroups.length === 0 && !loading && (
            <Card className="text-center py-12">
              <CardContent>
                <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <CardTitle className="mb-2">No public groups available</CardTitle>
                <CardDescription>Be the first to create a public study group for others to join</CardDescription>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
