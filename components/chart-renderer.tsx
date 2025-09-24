"use client"

import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useState } from 'react'
import { Palette, TrendingUp } from 'lucide-react'

export interface ChartData {
  type: 'line' | 'bar' | 'pie'
  title: string
  data: any[]
  xKey?: string
  yKey?: string
  description?: string
}

interface ChartRendererProps {
  chartData: ChartData
}

const DEFAULT_COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald  
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
]

const COLOR_THEMES = {
  default: DEFAULT_COLORS,
  business: ['#1f2937', '#374151', '#6b7280', '#9ca3af', '#d1d5db', '#e5e7eb', '#f3f4f6', '#f9fafb', '#ffffff'],
  ocean: ['#0369a1', '#0284c7', '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', '#f0f9ff', '#f8fafc'],
  forest: ['#166534', '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', '#f0fdf4'],
  sunset: ['#dc2626', '#ea580c', '#f59e0b', '#eab308', '#facc15', '#fde047', '#fef08a', '#fefce8', '#fffbeb'],
  purple: ['#581c87', '#7c2d12', '#a21caf', '#c2410c', '#dc2626', '#ea580c', '#f59e0b', '#eab308', '#facc15']
}

// Calculate linear regression for trend line
const calculateTrendLine = (data: any[], xKey: string, yKey: string) => {
  if (data.length < 2) return null
  
  const points = data.map((item, index) => ({
    x: index, // Use index for x-coordinate
    y: typeof item[yKey] === 'number' ? item[yKey] : 0
  }))
  
  const n = points.length
  const sumX = points.reduce((sum, p) => sum + p.x, 0)
  const sumY = points.reduce((sum, p) => sum + p.y, 0)
  const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
  const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
  const intercept = (sumY - slope * sumX) / n
  
  return points.map(p => ({
    x: p.x,
    trend: slope * p.x + intercept
  }))
}

export function ChartRenderer({ chartData }: ChartRendererProps) {
  const { type, title, data, xKey = 'name', yKey = 'value', description } = chartData
  const [selectedTheme, setSelectedTheme] = useState<keyof typeof COLOR_THEMES>('default')
  const [showColorPicker, setShowColorPicker] = useState(false)
  const [showTrendLine, setShowTrendLine] = useState(type === 'line' && data.length >= 3)
  
  const COLORS = COLOR_THEMES[selectedTheme]
  
  // Calculate trend line data for line charts
  const trendData = type === 'line' && showTrendLine ? calculateTrendLine(data, xKey, yKey) : null

  if (!data || data.length === 0) {
    return (
      <div className="p-4 border rounded-lg bg-muted/50">
        <h3 className="font-semibold mb-2">{title}</h3>
        <p className="text-sm text-muted-foreground">No data available</p>
      </div>
    )
  }

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Bar dataKey={yKey} fill={COLORS[0]} />
            </BarChart>
          </ResponsiveContainer>
        )
      
      case 'line':
        // Combine original data with trend data
        const combinedData = trendData ? data.map((item, index) => ({
          ...item,
          trend: trendData[index]?.trend || 0
        })) : data

        return (
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={combinedData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey={xKey} stroke="hsl(var(--foreground))" fontSize={12} />
              <YAxis stroke="hsl(var(--foreground))" fontSize={12} />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey={yKey} 
                stroke={COLORS[0]} 
                strokeWidth={2}
                name="Data"
              />
              {showTrendLine && trendData && (
                <Line 
                  type="monotone" 
                  dataKey="trend" 
                  stroke={COLORS[1]} 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  name="Trend"
                  dot={false}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )
      
      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey={yKey}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'hsl(var(--background))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '6px'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        )
      
      default:
        return <div className="text-sm text-muted-foreground">Unsupported chart type: {type}</div>
    }
  }

  return (
    <div className="my-6 p-4 border rounded-lg bg-card relative">
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <div className="flex items-center gap-1">
          {/* Trend Line Toggle - only for line charts with enough data */}
          {type === 'line' && data.length >= 3 && (
            <button
              onClick={() => setShowTrendLine(!showTrendLine)}
              className={`p-1 rounded transition-colors ${
                showTrendLine 
                  ? 'bg-primary/10 text-primary hover:bg-primary/20' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
              }`}
              title={showTrendLine ? "Hide trend line" : "Show trend line"}
            >
              <TrendingUp className="w-4 h-4" />
            </button>
          )}
          
          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 rounded hover:bg-muted transition-colors"
              title="Change colors"
            >
              <Palette className="w-4 h-4 text-muted-foreground hover:text-foreground" />
            </button>
          
          {showColorPicker && (
            <div className="absolute right-0 top-8 bg-card border rounded-lg shadow-lg p-3 z-10 min-w-[200px]">
              <p className="text-xs font-medium mb-2">Color Themes:</p>
              <div className="space-y-2">
                {Object.keys(COLOR_THEMES).map((themeName) => (
                  <button
                    key={themeName}
                    onClick={() => {
                      setSelectedTheme(themeName as keyof typeof COLOR_THEMES)
                      setShowColorPicker(false)
                    }}
                    className={`w-full text-left px-2 py-1 rounded text-xs transition-colors ${
                      selectedTheme === themeName 
                        ? 'bg-primary text-primary-foreground' 
                        : 'hover:bg-muted'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="flex gap-0.5">
                        {COLOR_THEMES[themeName as keyof typeof COLOR_THEMES].slice(0, 4).map((color, i) => (
                          <div 
                            key={i} 
                            className="w-3 h-3 rounded-sm" 
                            style={{ backgroundColor: color }}
                          />
                        ))}
                      </div>
                      <span className="capitalize">{themeName}</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
          </div>
        </div>
      </div>
      {description && (
        <p className="text-sm text-muted-foreground mb-4">{description}</p>
      )}
      {renderChart()}
    </div>
  )
}

export function parseChartFromText(content: string): ChartData | null {
  const chartMatch = content.match(/```chart\s*\n([\s\S]*?)\n```/)
  
  if (!chartMatch) return null
  
  try {
    const chartData = JSON.parse(chartMatch[1])
    
    // Validate required fields
    if (!chartData.type || !chartData.title || !chartData.data) {
      return null
    }
    
    // Validate chart type
    if (!['line', 'bar', 'pie'].includes(chartData.type)) {
      return null
    }
    
    return chartData as ChartData
  } catch (error) {
    console.error('Error parsing chart data:', error)
    return null
  }
}