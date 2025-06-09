"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, Shuffle, Edit3, Upload, X } from "lucide-react"

type SkillLevel = "good" | "average" | "weak"

interface Player {
  name: string
  skill: SkillLevel
  avatar?: string
}

interface Team {
  name: string
  players: Player[]
  totalSkill: number
}

const skillValues = {
  good: 3,
  average: 2,
  weak: 1,
}

const skillLabels = {
  good: "Tốt",
  average: "Trung bình",
  weak: "Yếu",
}

export default function FootballLineup() {
  const [players, setPlayers] = useState<Player[]>(
    Array.from({ length: 14 }, (_, i) => ({ name: "", skill: "average" as SkillLevel })),
  )
  const [teams, setTeams] = useState<Team[]>([])
  const [showLineup, setShowLineup] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState<{ teamIndex: number; playerIndex: number } | null>(null)

  const updatePlayer = (index: number, field: keyof Player, value: string) => {
    const newPlayers = [...players]
    newPlayers[index] = { ...newPlayers[index], [field]: value }
    setPlayers(newPlayers)
  }

  const handleAvatarUpload = (index: number, event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        const newPlayers = [...players]
        newPlayers[index] = { ...newPlayers[index], avatar: e.target?.result as string }
        setPlayers(newPlayers)
      }
      reader.readAsDataURL(file)
    }
  }

  const removeAvatar = (index: number) => {
    const newPlayers = [...players]
    delete newPlayers[index].avatar
    setPlayers(newPlayers)
  }

  const balanceTeams = () => {
    const validPlayers = players.filter((p) => p.name.trim() !== "")
    if (validPlayers.length < 14) {
      alert("Vui lòng nhập đủ 14 tên cầu thủ!")
      return
    }

    // Sắp xếp cầu thủ theo trình độ giảm dần
    const sortedPlayers = [...validPlayers].sort((a, b) => skillValues[b.skill] - skillValues[a.skill])

    const team1: Player[] = []
    const team2: Player[] = []
    let team1Skill = 0
    let team2Skill = 0

    // Phân chia cầu thủ để cân bằng trình độ
    sortedPlayers.forEach((player) => {
      if (team1.length < 7 && (team2.length === 7 || team1Skill <= team2Skill)) {
        team1.push(player)
        team1Skill += skillValues[player.skill]
      } else {
        team2.push(player)
        team2Skill += skillValues[player.skill]
      }
    })

    setTeams([
      { name: "Đội Xanh", players: team1, totalSkill: team1Skill },
      { name: "Đội Đỏ", players: team2, totalSkill: team2Skill },
    ])
    setShowLineup(true)
  }

  const updateTeamPlayer = (teamIndex: number, playerIndex: number, newName: string) => {
    const newTeams = [...teams]
    newTeams[teamIndex].players[playerIndex].name = newName
    setTeams(newTeams)
    setEditingPlayer(null)
  }

  const resetForm = () => {
    setShowLineup(false)
    setTeams([])
    setEditingPlayer(null)
  }

  const PlayerPosition = ({
    player,
    teamIndex,
    playerIndex,
    position,
  }: {
    player: Player
    teamIndex: number
    playerIndex: number
    position: string
  }) => {
    const isEditing = editingPlayer?.teamIndex === teamIndex && editingPlayer?.playerIndex === playerIndex

    return (
      <div className={`relative group ${position}`}>
        <div
          className={`
          w-16 h-16 rounded-full flex items-center justify-center text-xs font-bold text-white shadow-lg cursor-pointer overflow-hidden
          ${teamIndex === 0 ? "border-4 border-blue-500" : "border-4 border-red-500"}
          transition-all duration-200 hover:scale-110
        `}
        >
          {player.avatar ? (
            <img
              src={player.avatar || "/placeholder.svg"}
              alt={player.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <div
              className={`w-full h-full rounded-full flex items-center justify-center ${
                teamIndex === 0 ? "bg-blue-500 hover:bg-blue-600" : "bg-red-500 hover:bg-red-600"
              }`}
            >
              {isEditing ? (
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updateTeamPlayer(teamIndex, playerIndex, e.target.value)}
                  onBlur={() => setEditingPlayer(null)}
                  onKeyDown={(e) => e.key === "Enter" && setEditingPlayer(null)}
                  className="w-12 h-8 text-xs text-center bg-white text-black rounded border-none outline-none"
                  autoFocus
                />
              ) : (
                <span className="text-center leading-tight px-1">
                  {player.name
                    .split(" ")
                    .map((word) => word.charAt(0))
                    .join("")
                    .slice(0, 3)}
                </span>
              )}
            </div>
          )}
        </div>
        <div className="absolute -bottom-8 left-1/2 transform -translate-x-1/2 text-xs font-medium text-white bg-black bg-opacity-70 px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
          {player.name}
        </div>
        <Edit3
          className="absolute -top-2 -right-2 w-4 h-4 text-white bg-gray-600 rounded-full p-1 opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity"
          onClick={() => setEditingPlayer({ teamIndex, playerIndex })}
        />
      </div>
    )
  }

  if (showLineup) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-400 to-green-600 relative overflow-hidden">
        {/* Football field background */}
        <div className="absolute inset-0 opacity-20">
          <div className="w-full h-full bg-green-500 relative">
            {/* Field lines */}
            <div className="absolute inset-0">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-white transform -translate-y-1/2"></div>
              <div className="absolute top-1/2 left-1/2 w-32 h-32 border-2 border-white rounded-full transform -translate-x-1/2 -translate-y-1/2"></div>
              <div className="absolute top-0 left-1/4 right-1/4 h-20 border-2 border-white border-b-0"></div>
              <div className="absolute bottom-0 left-1/4 right-1/4 h-20 border-2 border-white border-t-0"></div>
            </div>
          </div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-white mb-4 drop-shadow-lg">Đội Hình Đã Sắp Xếp</h1>
            <div className="flex justify-center gap-8 mb-6">
              {teams.map((team, index) => (
                <div key={index} className="text-center">
                  <h2 className={`text-2xl font-bold drop-shadow-lg ${index === 0 ? "text-blue-200" : "text-red-200"}`}>
                    {team.name}
                  </h2>
                  <p className="text-white drop-shadow">Tổng điểm: {team.totalSkill}</p>
                </div>
              ))}
            </div>
            <Button onClick={resetForm} className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold">
              <Shuffle className="w-4 h-4 mr-2" />
              Sắp xếp lại
            </Button>
          </div>

          {/* Football field layout with corrected 2-3-1 formation */}
          <div className="max-w-6xl mx-auto">
            <div className="bg-green-600 bg-opacity-60 rounded-lg p-8 relative min-h-[800px] backdrop-blur-sm">
              {/* Center line */}
              <div className="absolute top-0 bottom-0 left-1/2 w-0.5 bg-white transform -translate-x-1/2 opacity-70"></div>

              {/* Team 1 (Left side) - Formation 2-3-1 */}
              <div className="absolute left-4 top-1/2 transform -translate-y-1/2">
                <div className="relative w-[400px] h-[600px]">
                  {/* Goalkeeper */}
                  <PlayerPosition
                    player={teams[0]?.players[0]}
                    teamIndex={0}
                    playerIndex={0}
                    position="absolute left-8 top-1/2 transform -translate-y-1/2"
                  />

                  {/* 2 Defenders */}
                  <PlayerPosition
                    player={teams[0]?.players[1]}
                    teamIndex={0}
                    playerIndex={1}
                    position="absolute left-24 top-[120px]"
                  />
                  <PlayerPosition
                    player={teams[0]?.players[2]}
                    teamIndex={0}
                    playerIndex={2}
                    position="absolute left-24 bottom-[120px]"
                  />

                  {/* 3 Midfielders */}
                  <PlayerPosition
                    player={teams[0]?.players[3]}
                    teamIndex={0}
                    playerIndex={3}
                    position="absolute left-48 top-[80px]"
                  />
                  <PlayerPosition
                    player={teams[0]?.players[4]}
                    teamIndex={0}
                    playerIndex={4}
                    position="absolute left-48 top-1/2 transform -translate-y-1/2"
                  />
                  <PlayerPosition
                    player={teams[0]?.players[5]}
                    teamIndex={0}
                    playerIndex={5}
                    position="absolute left-48 bottom-[80px]"
                  />

                  {/* 1 Forward */}
                  <PlayerPosition
                    player={teams[0]?.players[6]}
                    teamIndex={0}
                    playerIndex={6}
                    position="absolute left-72 top-1/2 transform -translate-y-1/2"
                  />
                </div>
              </div>

              {/* Team 2 (Right side) - Formation 1-3-2 (mirrored) */}
              <div className="absolute right-4 top-1/2 transform -translate-y-1/2">
                <div className="relative w-[400px] h-[600px]">
                  {/* Goalkeeper */}
                  <PlayerPosition
                    player={teams[1]?.players[0]}
                    teamIndex={1}
                    playerIndex={0}
                    position="absolute right-8 top-1/2 transform -translate-y-1/2"
                  />

                  {/* 2 Defenders */}
                  <PlayerPosition
                    player={teams[1]?.players[1]}
                    teamIndex={1}
                    playerIndex={1}
                    position="absolute right-24 top-[120px]"
                  />
                  <PlayerPosition
                    player={teams[1]?.players[2]}
                    teamIndex={1}
                    playerIndex={2}
                    position="absolute right-24 bottom-[120px]"
                  />

                  {/* 3 Midfielders */}
                  <PlayerPosition
                    player={teams[1]?.players[3]}
                    teamIndex={1}
                    playerIndex={3}
                    position="absolute right-48 top-[80px]"
                  />
                  <PlayerPosition
                    player={teams[1]?.players[4]}
                    teamIndex={1}
                    playerIndex={4}
                    position="absolute right-48 top-1/2 transform -translate-y-1/2"
                  />
                  <PlayerPosition
                    player={teams[1]?.players[5]}
                    teamIndex={1}
                    playerIndex={5}
                    position="absolute right-48 bottom-[80px]"
                  />

                  {/* 1 Forward */}
                  <PlayerPosition
                    player={teams[1]?.players[6]}
                    teamIndex={1}
                    playerIndex={6}
                    position="absolute right-72 top-1/2 transform -translate-y-1/2"
                  />
                </div>
              </div>

              {/* Formation labels */}
              <div className="absolute bottom-4 left-4 text-white text-sm font-bold bg-black bg-opacity-50 px-3 py-1 rounded">
                Sơ đồ: 2-3-1
              </div>
            </div>
          </div>

          <div className="text-center mt-6 text-white text-sm drop-shadow">
            <p>💡 Nhấp vào biểu tượng chỉnh sửa để thay đổi tên cầu thủ</p>
            <p>📸 Avatar cầu thủ sẽ hiển thị thay cho chấm tròn màu</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-400 to-green-600 py-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-4 flex items-center justify-center gap-3">
            <Users className="w-12 h-12" />
            Sắp Xếp Đội Bóng
          </h1>
          <p className="text-xl text-green-100">Tạo đội hình cân bằng và công bằng cho trận đấu của bạn!</p>
        </div>

        <Card className="max-w-5xl mx-auto shadow-2xl border-0">
          <CardHeader className="bg-white">
            <CardTitle className="text-2xl text-center text-green-700 flex items-center justify-center gap-2">
              <Users className="w-6 h-6" />
              Nhập Thông Tin 14 Cầu Thủ
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6 bg-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              {players.map((player, index) => (
                <div key={index} className="flex gap-3 items-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center font-bold text-sm">
                    {index + 1}
                  </div>

                  {/* Avatar section */}
                  <div className="flex-shrink-0">
                    {player.avatar ? (
                      <div className="relative">
                        <img
                          src={player.avatar || "/placeholder.svg"}
                          alt={`Avatar ${index + 1}`}
                          className="w-12 h-12 rounded-full object-cover border-2 border-green-300"
                        />
                        <button
                          onClick={() => removeAvatar(index)}
                          className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center text-xs hover:bg-red-600"
                        >
                          <X className="w-2 h-2" />
                        </button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleAvatarUpload(index, e)}
                          className="hidden"
                        />
                        <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center border-2 border-dashed border-gray-400 hover:border-green-400 hover:bg-green-50 transition-colors">
                          <Upload className="w-4 h-4 text-gray-500" />
                        </div>
                      </label>
                    )}
                  </div>

                  <Input
                    placeholder={`Tên cầu thủ ${index + 1}`}
                    value={player.name}
                    onChange={(e) => updatePlayer(index, "name", e.target.value)}
                    className="flex-1 border-green-300 focus:border-green-500"
                  />
                  <Select
                    value={player.skill}
                    onValueChange={(value: SkillLevel) => updatePlayer(index, "skill", value)}
                  >
                    <SelectTrigger className="w-32 border-green-300 focus:border-green-500">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="good" className="text-green-600 font-medium">
                        ⭐⭐⭐ Tốt
                      </SelectItem>
                      <SelectItem value="average" className="text-yellow-600 font-medium">
                        ⭐⭐ Trung bình
                      </SelectItem>
                      <SelectItem value="weak" className="text-orange-600 font-medium">
                        ⭐ Yếu
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Button
                onClick={balanceTeams}
                size="lg"
                className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 text-black font-bold text-lg px-8 py-4 rounded-full shadow-lg transform hover:scale-105 transition-all duration-200"
              >
                <Shuffle className="w-6 h-6 mr-3" />🏆 Sắp Xếp Đội Hình Ngay!
              </Button>
            </div>

            <div className="mt-6 text-center text-sm text-gray-600">
              <p>💡 Hệ thống sẽ tự động cân bằng trình độ giữa hai đội để trận đấu thêm hấp dẫn!</p>
              <p>📸 Click vào biểu tượng upload để thêm avatar cho từng cầu thủ</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
