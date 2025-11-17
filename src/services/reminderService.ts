import { supabase } from '../lib/supabase'
import type { DueWord, ReminderSettings, DueWordsBreakdown } from '../types'

/**
 * Service for managing due words reminders and notifications
 * Implements the Leitner system interval-based reminders
 */
export class ReminderService {
  private static instance: ReminderService

  private constructor() {}

  static getInstance(): ReminderService {
    if (!ReminderService.instance) {
      ReminderService.instance = new ReminderService()
    }
    return ReminderService.instance
  }

  /**
   * Get all due words for a user
   * @param userId - User ID
   * @param includeOverdue - Include overdue words (default: true)
   * @returns Array of due words
   */
  async getDueWords(userId: string, includeOverdue: boolean = true): Promise<DueWord[]> {
    try {
      const { data, error } = await supabase.rpc('get_due_words', {
        p_user_id: userId,
        p_include_overdue: includeOverdue
      })

      if (error) {
        // If function doesn't exist (migration not run), return empty array
        if (error.message?.includes('function') || error.code === '42883') {
          console.warn('get_due_words function not found - migration may not be applied yet')
          return []
        }
        console.error('Error fetching due words:', error)
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Failed to get due words:', error)
      // Return empty array instead of throwing to prevent crashes
      return []
    }
  }

  /**
   * Get due words breakdown by urgency
   * @param userId - User ID
   * @returns Breakdown of due words (overdue, today, soon)
   */
  async getDueWordsBreakdown(userId: string): Promise<DueWordsBreakdown> {
    try {
      const dueWords = await this.getDueWords(userId, true)
      const now = new Date()
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const tomorrow = new Date(today)
      tomorrow.setDate(tomorrow.getDate() + 1)
      const dayAfterTomorrow = new Date(today)
      dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 2)

      return {
        overdue: dueWords.filter(w => new Date(w.due_date) < today),
        dueToday: dueWords.filter(w => {
          const due = new Date(w.due_date)
          return due >= today && due < tomorrow
        }),
        dueSoon: dueWords.filter(w => {
          const due = new Date(w.due_date)
          return due >= tomorrow && due < dayAfterTomorrow
        }),
        total: dueWords.length
      }
    } catch (error) {
      console.error('Failed to get due words breakdown:', error)
      // Return empty breakdown instead of throwing to prevent crashes
      return {
        overdue: [],
        dueToday: [],
        dueSoon: [],
        total: 0
      }
    }
  }

  /**
   * Get reminder settings for a user
   * @param userId - User ID
   * @returns Reminder settings or null if not set
   */
  async getReminderSettings(userId: string): Promise<ReminderSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_reminder_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle()

      if (error) {
        // If table doesn't exist (migration not run), return null
        if (error.message?.includes('relation') || error.code === '42P01') {
          console.warn('user_reminder_settings table not found - migration may not be applied yet')
          return null
        }
        console.error('Error fetching reminder settings:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to get reminder settings:', error)
      // Return null instead of throwing to prevent crashes
      return null
    }
  }

  /**
   * Update or create reminder settings for a user
   * @param userId - User ID
   * @param settings - Partial settings to update
   * @returns Updated settings
   */
  async updateReminderSettings(
    userId: string,
    settings: Partial<Omit<ReminderSettings, 'user_id'>>
  ): Promise<ReminderSettings> {
    try {
      const { data, error } = await supabase
        .from('user_reminder_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single()

      if (error) {
        console.error('Error updating reminder settings:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to update reminder settings:', error)
      throw new Error('Failed to update reminder settings')
    }
  }

  /**
   * Initialize default reminder settings for a user
   * @param userId - User ID
   * @returns Created settings
   */
  async initializeReminderSettings(userId: string): Promise<ReminderSettings> {
    try {
      const { data, error } = await supabase
        .from('user_reminder_settings')
        .insert({
          user_id: userId,
          enabled: true,
          reminder_time: '19:00:00',
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
          min_due_words: 5,
          push_enabled: true,
          email_enabled: false,
          sms_enabled: false,
          reminder_days: [1, 2, 3, 4, 5] // Monday to Friday
        })
        .select()
        .single()

      if (error) {
        console.error('Error initializing reminder settings:', error)
        throw error
      }

      return data
    } catch (error) {
      console.error('Failed to initialize reminder settings:', error)
      throw new Error('Failed to initialize reminder settings')
    }
  }

  /**
   * Check if a reminder should be sent to a user
   * @param userId - User ID
   * @returns True if reminder should be sent
   */
  async shouldSendReminder(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('should_send_reminder', {
        p_user_id: userId
      })

      if (error) {
        console.error('Error checking should send reminder:', error)
        throw error
      }

      return data || false
    } catch (error) {
      console.error('Failed to check should send reminder:', error)
      return false
    }
  }

  /**
   * Log a reminder to history
   * @param userId - User ID
   * @param method - Notification method
   * @param dueWordsCount - Number of due words
   */
  async logReminder(
    userId: string,
    method: 'push' | 'email' | 'sms',
    dueWordsCount: number
  ): Promise<void> {
    try {
      const { error } = await supabase.from('reminder_history').insert({
        user_id: userId,
        due_words_count: dueWordsCount,
        method
      })

      if (error) {
        console.error('Error logging reminder:', error)
        throw error
      }

      // Update last reminder sent timestamp
      await supabase
        .from('user_reminder_settings')
        .update({ last_reminder_sent: new Date().toISOString() })
        .eq('user_id', userId)
    } catch (error) {
      console.error('Failed to log reminder:', error)
    }
  }

  /**
   * Send a push notification reminder
   * @param userId - User ID
   * @param count - Number of due words
   */
  async sendPushNotification(userId: string, count: number): Promise<void> {
    // TODO: Implement with push service (e.g., Firebase Cloud Messaging)
    console.log(`[Push Notification] Sending to ${userId}: ${count} words due`)

    // For now, just log the reminder
    await this.logReminder(userId, 'push', count)
  }

  /**
   * Send an email reminder
   * @param userId - User ID
   * @param breakdown - Due words breakdown
   */
  async sendEmailReminder(userId: string, breakdown: DueWordsBreakdown): Promise<void> {
    // TODO: Implement with email service (e.g., SendGrid, Supabase)
    console.log(`[Email] Sending to ${userId}: ${breakdown.total} words due`)
    console.log(`  - Overdue: ${breakdown.overdue.length}`)
    console.log(`  - Due Today: ${breakdown.dueToday.length}`)
    console.log(`  - Due Soon: ${breakdown.dueSoon.length}`)

    // For now, just log the reminder
    await this.logReminder(userId, 'email', breakdown.total)
  }

  /**
   * Send an SMS reminder
   * @param userId - User ID
   * @param count - Number of due words
   */
  async sendSMSReminder(userId: string, count: number): Promise<void> {
    // TODO: Implement with SMS service (e.g., Twilio)
    console.log(`[SMS] Sending to ${userId}: ${count} words due`)

    // For now, just log the reminder
    await this.logReminder(userId, 'sms', count)
  }

  /**
   * Send reminder based on user settings
   * @param userId - User ID
   */
  async sendReminder(userId: string): Promise<void> {
    try {
      const settings = await this.getReminderSettings(userId)
      if (!settings || !settings.enabled) {
        return
      }

      const breakdown = await this.getDueWordsBreakdown(userId)

      if (breakdown.total < settings.min_due_words) {
        console.log(`Not enough due words (${breakdown.total} < ${settings.min_due_words})`)
        return
      }

      // Send based on enabled methods
      if (settings.push_enabled) {
        await this.sendPushNotification(userId, breakdown.total)
      }

      if (settings.email_enabled) {
        await this.sendEmailReminder(userId, breakdown)
      }

      if (settings.sms_enabled) {
        await this.sendSMSReminder(userId, breakdown.total)
      }
    } catch (error) {
      console.error('Failed to send reminder:', error)
    }
  }
}

// Export singleton instance
export const reminderService = ReminderService.getInstance()
