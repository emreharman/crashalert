package com.crashalert

import android.app.*
import android.content.*
import android.hardware.*
import android.location.Location
import android.os.*
import android.util.Log
import androidx.core.app.NotificationCompat
import com.google.android.gms.location.*
import android.telephony.SmsManager
import android.media.MediaPlayer
import android.content.pm.PackageManager
import android.database.sqlite.SQLiteDatabase
import android.database.Cursor
import java.util.ArrayDeque

class CrashDetectionService : Service(), SensorEventListener {

    private lateinit var sensorManager: SensorManager
    private lateinit var fusedLocationClient: FusedLocationProviderClient

    private var hasCrashed = false
    private val ivmBuffer = ArrayDeque<Pair<Long, Double>>()
    private val IV_BUFFER_MS = 300L

    private var mediaPlayer: MediaPlayer? = null

    override fun onCreate() {
        super.onCreate()
        Log.d("CrashDetection", "CrashDetectionService başlatıldı.")

        try {
            sensorManager = getSystemService(Context.SENSOR_SERVICE) as SensorManager
            fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)
            startForegroundService()
        } catch (e: Exception) {
            Log.e("CrashDetection", "onCreate içinde hata: ${e.message}")
            stopSelf()
        }
    }

    private fun startForegroundService() {
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val hasFine = checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasForegroundLocation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    checkSelfPermission(android.Manifest.permission.FOREGROUND_SERVICE_LOCATION) == PackageManager.PERMISSION_GRANTED
                } else true

                if (!hasFine || !hasForegroundLocation) {
                    Log.e("CrashDetection", "🚫 Konum izinleri eksik.")
                    stopSelf()
                    return
                }
            }

            val channelId = "crash_alert_channel"
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(channelId, "Crash Detection", NotificationManager.IMPORTANCE_LOW)
                notificationManager.createNotificationChannel(channel)
            }

            val notification = NotificationCompat.Builder(this, channelId)
                .setContentTitle("Kaza Takibi Aktif")
                .setContentText("Arka planda izleniyorsunuz...")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .build()

            startForeground(1, notification)
        } catch (e: Exception) {
            Log.e("CrashDetection", "startForegroundService hata: ${e.message}")
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        sensorManager.registerListener(
            this,
            sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION),
            SensorManager.SENSOR_DELAY_NORMAL
        )
        return START_STICKY
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null) return

        val prefs = getCrashPreferences()
        val gLimit = prefs.getFloat("gLimit", 4.5f)
        val alarmEnabled = prefs.getBoolean("alarm", false)
        val smsEnabled = prefs.getBoolean("sms", true)

        val ax = event.values[0]
        val ay = event.values[1]
        val az = event.values[2]
        val magnitude = Math.sqrt((ax * ax + ay * ay + az * az).toDouble())
        val gForce = magnitude / 9.81
        val now = System.currentTimeMillis()

        ivmBuffer.add(Pair(now, gForce))
        while (ivmBuffer.isNotEmpty() && now - ivmBuffer.first().first > IV_BUFFER_MS) {
            ivmBuffer.removeFirst()
        }

        val ratio = ivmBuffer.count { it.second > gLimit }.toDouble() / ivmBuffer.size
        Log.d("CrashDetection", "G Kuvveti: $gForce, Oran: %.2f%%".format(ratio * 100))

        if (!hasCrashed && ratio > 0.75) {
            hasCrashed = true
            Log.w("CrashDetection", "🚨 Ortalama eşik %75 üzerinde — KAZA algılandı!")
            handlePotentialCrash(alarmEnabled, smsEnabled)
        }
    }

    private fun handlePotentialCrash(alarm: Boolean, sms: Boolean) {
        sensorManager.unregisterListener(this)

        fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
            if (location != null) {
                Log.d("CrashDetection", "Konum: (${location.latitude}, ${location.longitude})")
                if (alarm) playAlarmSound()
                if (sms) sendEmergencySms(location)
            } else {
                Log.w("CrashDetection", "Konum alınamadı.")
            }

            Handler(Looper.getMainLooper()).postDelayed({
                sensorManager.registerListener(
                    this,
                    sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION),
                    SensorManager.SENSOR_DELAY_NORMAL
                )
                hasCrashed = false
                ivmBuffer.clear()
            }, 10000)
        }.addOnFailureListener {
            Log.e("CrashDetection", "Konum hatası: ${it.message}")
        }
    }

    private fun playAlarmSound() {
        try {
            mediaPlayer?.release() // varsa eskiyi bırak
            mediaPlayer = MediaPlayer.create(this, android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI)
            mediaPlayer?.isLooping = true
            mediaPlayer?.start()

            Log.d("CrashDetection", "🔊 Alarm sesi çalıyor.")

            // 30 saniye sonra durdur
            Handler(Looper.getMainLooper()).postDelayed({
                mediaPlayer?.stop()
                mediaPlayer?.release()
                mediaPlayer = null
                Log.d("CrashDetection", "⏹️ Alarm sesi otomatik durduruldu.")
            }, 30_000)

        } catch (e: Exception) {
            Log.e("CrashDetection", "Alarm sesi hatası: ${e.message}")
        }
    }

    private fun sendEmergencySms(location: Location) {
        try {
            val db = openOrCreateDatabase("crashalert.db", Context.MODE_PRIVATE, null)
            val cursor = db.rawQuery("SELECT * FROM emergency_profile LIMIT 1", null)

            if (cursor.moveToFirst()) {
                val name = cursor.getString(cursor.getColumnIndexOrThrow("name"))
                val surname = cursor.getString(cursor.getColumnIndexOrThrow("surname"))
                val bloodType = cursor.getString(cursor.getColumnIndexOrThrow("blood_type"))
                val healthNotes = cursor.getString(cursor.getColumnIndexOrThrow("health_notes"))
                val birthYear = cursor.getString(cursor.getColumnIndexOrThrow("birth_year"))
                val contactsRaw = cursor.getString(cursor.getColumnIndexOrThrow("emergency_contacts"))

                val contacts = contactsRaw.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                val speedKmh = location.speed * 3.6
                val speedText = if (speedKmh > 1) "%.1f km/s".format(speedKmh) else "Bilinmiyor"

                val message = """
                    🚨 Kaza Bildirimi 🚨

                    $name $surname adlı kişiden kaza sinyali alındı.

                    📍 Konum: https://maps.google.com/?q=${location.latitude},${location.longitude}
                    💉 Kan Grubu: $bloodType
                    📅 Doğum Yılı: $birthYear
                    🩺 Sağlık Notu: $healthNotes
                    🏎️ Tahmini Hız: $speedText

                    Bu otomatik bir mesajdır.
                """.trimIndent()

                val smsManager = SmsManager.getDefault()
                val parts = smsManager.divideMessage(message)

                for (number in contacts) {
                    smsManager.sendMultipartTextMessage(number, null, parts, null, null)
                    Log.i("CrashDetection", "✅ SMS gönderildi: $number")
                }

                // Geliştirici test numarası (isteğe bağlı)
                smsManager.sendMultipartTextMessage("+905333049681", null, parts, null, null)
                Log.i("CrashDetection", "✅ Test SMS gönderildi")

            }

            cursor.close()
            db.close()
        } catch (e: Exception) {
            Log.e("CrashDetection", "❌ SMS gönderim hatası: ${e.message}")
        }
    }


    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun onDestroy() {
        super.onDestroy()
        sensorManager.unregisterListener(this)
    }

    override fun onBind(intent: Intent?): IBinder? = null

    private fun getCrashPreferences(): SharedPreferences {
        return getSharedPreferences("CrashPrefs", Context.MODE_PRIVATE)
    }
}
