import { useState, useEffect } from 'react'
import { Bell, Check, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { supabase } from '../lib/supabase'
import { reminderService } from '../services/reminderService'
import type { ReminderSettings as ReminderSettingsType } from '../types'
import { Card } from './ui/Card'
import { MARGIN_BOTTOM } from '../constants/spacing'

/**
 * Component for managing user reminder settings
 * Allows users to configure when and how they receive due word reminders
 */
export const ReminderSettings = () => {
  const [settings, setSettings] = useState<ReminderSettingsType | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const { t } = useTranslation()

  useEffect(() => {
    loadSettings()
  }, [])

  const loadSettings = async () => {
    try {
      setLoading(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      let userSettings = await reminderService.getReminderSettings(user.id)

      // Initialize settings if they don't exist
      if (!userSettings) {
        userSettings = await reminderService.initializeReminderSettings(user.id)
      }

      setSettings(userSettings)
    } catch (error) {
      console.error('Error loading reminder settings:', error)
      showMessage('error', 'Failed to load settings')
    } finally {
      setLoading(false)
    }
  }

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text })
    setTimeout(() => setMessage(null), 3000)
  }

  const handleToggleEnabled = async () => {
    if (!settings) return

    const newSettings = { ...settings, enabled: !settings.enabled }
    setSettings(newSettings)
    await saveSettings({ enabled: newSettings.enabled })
  }

  const handleTimeChange = async (time: string) => {
    if (!settings) return

    const newSettings = { ...settings, reminder_time: time + ':00' }
    setSettings(newSettings)
    await saveSettings({ reminder_time: newSettings.reminder_time })
  }

  const handleMinDueWordsChange = async (value: number) => {
    if (!settings) return

    const newSettings = { ...settings, min_due_words: value }
    setSettings(newSettings)
    await saveSettings({ min_due_words: value })
  }

  const handleToggleMethod = async (method: 'push_enabled' | 'email_enabled' | 'sms_enabled') => {
    if (!settings) return

    const newSettings = { ...settings, [method]: !settings[method] }
    setSettings(newSettings)
    await saveSettings({ [method]: newSettings[method] })
  }

  const handleToggleDay = async (day: number) => {
    if (!settings) return

    let newDays: number[]
    if (settings.reminder_days.includes(day)) {
      newDays = settings.reminder_days.filter(d => d !== day)
    } else {
      newDays = [...settings.reminder_days, day].sort()
    }

    const newSettings = { ...settings, reminder_days: newDays }
    setSettings(newSettings)
    await saveSettings({ reminder_days: newDays })
  }

  const saveSettings = async (updates: Partial<ReminderSettingsType>) => {
    if (!settings) return

    try {
      setSaving(true)
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      await reminderService.updateReminderSettings(user.id, updates)
      showMessage('success', 'Settings saved successfully')
    } catch (error) {
      console.error('Error saving settings:', error)
      showMessage('error', 'Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card variant="default" size="default" className="animate-pulse">
        <div className="h-64 bg-gray-100 dark:bg-gray-700 rounded"></div>
      </Card>
    )
  }

  if (!settings) {
    return (
      <Card variant="default" size="default">
        <p className="text-gray-600 dark:text-gray-400">
          {t('reminders.settings.notAvailable', 'Reminder settings not available')}
        </p>
      </Card>
    )
  }

  const weekDays = [
    { value: 1, label: t('reminders.settings.days.monday', 'Mon') },
    { value: 2, label: t('reminders.settings.days.tuesday', 'Tue') },
    { value: 3, label: t('reminders.settings.days.wednesday', 'Wed') },
    { value: 4, label: t('reminders.settings.days.thursday', 'Thu') },
    { value: 5, label: t('reminders.settings.days.friday', 'Fri') },
    { value: 6, label: t('reminders.settings.days.saturday', 'Sat') },
    { value: 7, label: t('reminders.settings.days.sunday', 'Sun') },
  ]

  return (
    <Card variant="default" size="default">
      {/* Header */}
      <div className={`flex items-center gap-3 ${MARGIN_BOTTOM.md}`}>
        <Bell className="w-6 h-6 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-bold text-gray-900 dark:text-white">
          {t('reminders.settings.title', 'Reminder Settings')}
        </h3>
      </div>

      {/* Message */}
      {message && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          message.type === 'success'
            ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300'
            : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
        }`}>
          {message.type === 'success' ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
          <span className="text-sm">{message.text}</span>
        </div>
      )}

      {/* Enable/Disable Toggle */}
      <div className={`flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900 rounded-lg ${MARGIN_BOTTOM.md}`}>
        <div>
          <p className="font-medium text-gray-900 dark:text-white">
            {t('reminders.settings.enableReminders', 'Enable Reminders')}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {t('reminders.settings.enableDescription', 'Receive notifications when words are due')}
          </p>
        </div>
        <button
          onClick={handleToggleEnabled}
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
            settings.enabled
              ? 'bg-blue-600'
              : 'bg-gray-300 dark:bg-gray-600'
          } ${saving ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
              settings.enabled ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <>
          {/* Reminder Time */}
          <div className={`${MARGIN_BOTTOM.md}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('reminders.settings.reminderTime', 'Reminder Time')}
            </label>
            <input
              type="time"
              value={settings.reminder_time.substring(0, 5)}
              onChange={(e) => handleTimeChange(e.target.value)}
              disabled={saving}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:opacity-50"
            />
          </div>

          {/* Reminder Days */}
          <div className={`${MARGIN_BOTTOM.md}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('reminders.settings.reminderDays', 'Reminder Days')}
            </label>
            <div className="flex flex-wrap gap-2">
              {weekDays.map(day => (
                <button
                  key={day.value}
                  onClick={() => handleToggleDay(day.value)}
                  disabled={saving}
                  className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                    settings.reminder_days.includes(day.value)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                  } ${saving ? 'opacity-50 cursor-not-allowed' : 'hover:opacity-80'}`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Notification Methods */}
          <div className={`${MARGIN_BOTTOM.md}`}>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {t('reminders.settings.notificationMethods', 'Notification Methods')}
            </label>
            <div className="space-y-3">
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-900 dark:text-white">
                  {t('reminders.settings.pushNotifications', 'Push Notifications')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.push_enabled}
                  onChange={() => handleToggleMethod('push_enabled')}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer">
                <span className="text-sm text-gray-900 dark:text-white">
                  {t('reminders.settings.emailNotifications', 'Email Notifications')}
                </span>
                <input
                  type="checkbox"
                  checked={settings.email_enabled}
                  onChange={() => handleToggleMethod('email_enabled')}
                  disabled={saving}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>
              <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg cursor-pointer opacity-50">
                <div>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {t('reminders.settings.smsNotifications', 'SMS Notifications')}
                  </span>
                  <span className="ml-2 text-xs text-purple-600 dark:text-purple-400 font-semibold">
                    {t('reminders.settings.premium', 'Premium')}
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={settings.sms_enabled}
                  onChange={() => handleToggleMethod('sms_enabled')}
                  disabled={true}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
              </label>
            </div>
          </div>

          {/* Minimum Due Words */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t('reminders.settings.minimumWords', 'Minimum Words for Reminder')}
            </label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="1"
                max="20"
                value={settings.min_due_words}
                onChange={(e) => handleMinDueWordsChange(parseInt(e.target.value))}
                disabled={saving}
                className="flex-1"
              />
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400 w-12 text-center">
                {settings.min_due_words}
              </span>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t('reminders.settings.minimumWordsDescription', 'Only send reminders if at least this many words are due')}
            </p>
          </div>
        </>
      )}
    </Card>
  )
}
