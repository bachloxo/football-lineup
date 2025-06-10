"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Download, Upload, Trash2, Check, AlertCircle } from "lucide-react"

interface Player {
  name: string
  skill: string
  avatar?: string
}

interface DataStatusProps {
  players: Player[]
  onImportData: (data: Player[]) => void
  onExportData: () => void
  onClearData: () => void
}

export default function DataStatus({ players, onImportData, onExportData, onClearData }: DataStatusProps) {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [dataStats, setDataStats] = useState({ names: 0, avatars: 0, skills: 0 })

  useEffect(() => {
    const stats = players.reduce(
      (acc, player) => ({
        names: acc.names + (player.name.trim() ? 1 : 0),
        avatars: acc.avatars + (player.avatar ? 1 : 0),
        skills: acc.skills + (player.skill !== "average" ? 1 : 0),
      }),
      { names: 0, avatars: 0, skills: 0 },
    )
    setDataStats(stats)

    // Update last saved time
    const hasData = stats.names > 0 || stats.avatars > 0
    if (hasData) {
      setLastSaved(new Date())
    }
  }, [players])

  const handleExportToFile = () => {
    const dataToExport = {
      players,
      exportDate: new Date().toISOString(),
      version: "1.0",
    }

    const blob = new Blob([JSON.stringify(dataToExport, null, 2)], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `football-lineup-${new Date().toISOString().split("T")[0]}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleImportFromFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = JSON.parse(e.target?.result as string)
        if (data.players && Array.isArray(data.players) && data.players.length === 14) {
          onImportData(data.players)
        } else {
          alert("File không đúng định dạng hoặc không có đủ 14 cầu thủ!")
        }
      } catch (error) {
        alert("Không thể đọc file. Vui lòng chọn file JSON hợp lệ!")
      }
    }
    reader.readAsText(file)
    event.target.value = "" // Reset input
  }

  return (
    <Card className="mt-6 border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-blue-800 flex items-center gap-2">💾 Trạng thái dữ liệu</h3>
          {lastSaved && (
            <span className="text-xs text-blue-600 flex items-center gap-1">
              <Check className="w-3 h-3" />
              Đã lưu: {lastSaved.toLocaleTimeString()}
            </span>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-green-600">{dataStats.names}</div>
            <div className="text-xs text-gray-600">Tên cầu thủ</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-blue-600">{dataStats.avatars}</div>
            <div className="text-xs text-gray-600">Avatar</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-2xl font-bold text-purple-600">{dataStats.skills}</div>
            <div className="text-xs text-gray-600">Trình độ tùy chỉnh</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 justify-center">
          <Button
            onClick={handleExportToFile}
            size="sm"
            variant="outline"
            className="bg-green-100 hover:bg-green-200 text-green-700 border-green-300"
          >
            <Download className="w-4 h-4 mr-1" />
            Xuất file
          </Button>

          <label className="cursor-pointer">
            <input type="file" accept=".json" onChange={handleImportFromFile} className="hidden" />
            <Button
              size="sm"
              variant="outline"
              className="bg-blue-100 hover:bg-blue-200 text-blue-700 border-blue-300"
              asChild
            >
              <span>
                <Upload className="w-4 h-4 mr-1" />
                Nhập file
              </span>
            </Button>
          </label>

          <Button
            onClick={onClearData}
            size="sm"
            variant="outline"
            className="bg-red-100 hover:bg-red-200 text-red-700 border-red-300"
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Xóa tất cả
          </Button>
        </div>

        <div className="mt-3 text-xs text-blue-600 text-center">
          <AlertCircle className="w-3 h-3 inline mr-1" />
          Dữ liệu được lưu tự động trong trình duyệt và khôi phục khi quay lại
        </div>
      </CardContent>
    </Card>
  )
}
