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

class CrashDetectionService : Service(), SensorEventListener {

    private lateinit var sensorManager: SensorManager
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private var hasCrashed = false // 👈 Yeni eklendi

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
        Log.d("CrashDetection", "startForegroundService başladı.")
        try {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.Q) {
                val hasFine = checkSelfPermission(android.Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED
                val hasForegroundLocation = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.UPSIDE_DOWN_CAKE) {
                    checkSelfPermission(android.Manifest.permission.FOREGROUND_SERVICE_LOCATION) == PackageManager.PERMISSION_GRANTED
                } else true

                Log.d("CrashDetection", "hasFine=$hasFine, hasForegroundLocation=$hasForegroundLocation")

                if (!hasFine || !hasForegroundLocation) {
                    Log.e("CrashDetection", "🚫 Gerekli konum izinleri eksik. Servis durduruluyor.")
                    stopSelf()
                    return
                }
            }

            val channelId = "crash_alert_channel"
            val channelName = "Crash Detection"
            val notificationManager = getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(channelId, channelName, NotificationManager.IMPORTANCE_LOW)
                notificationManager.createNotificationChannel(channel)
            }

            val notification = NotificationCompat.Builder(this, channelId)
                .setContentTitle("Kaza Takibi Aktif")
                .setContentText("Arka planda izleniyorsunuz...")
                .setSmallIcon(android.R.drawable.ic_menu_mylocation)
                .build()

            startForeground(1, notification)
            Log.d("CrashDetection", "✅ Foreground servis BAŞLADI.")

        } catch (e: SecurityException) {
            Log.e("CrashDetection", "startForegroundService SecurityException: ${e.message}")
            stopSelf()
        } catch (e: Exception) {
            Log.e("CrashDetection", "startForegroundService bilinmeyen hata: ${e.message}")
            stopSelf()
        }
    }

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        Log.d("CrashDetection", "onStartCommand çağrıldı.")
        sensorManager.registerListener(
            this,
            sensorManager.getDefaultSensor(Sensor.TYPE_LINEAR_ACCELERATION),
            SensorManager.SENSOR_DELAY_NORMAL
        )
        return START_STICKY
    }

    override fun onSensorChanged(event: SensorEvent?) {
        if (event == null || hasCrashed) return // 👈 Sadece ilk algılamaya izin ver

        val ax = event.values[0]
        val ay = event.values[1]
        val az = event.values[2]

        val magnitude = Math.sqrt((ax * ax + ay * ay + az * az).toDouble())
        Log.d("CrashDetection", "İvme ölçümü: ax=$ax, ay=$ay, az=$az, magnitude=$magnitude")

        if (magnitude > 1 * 9.81) {
            hasCrashed = true // 👈 Artık bir daha çalışmasın
            Log.w("CrashDetection", "🚨 Eşik aşıldı: $magnitude m/s² — Kaza şüphesi!")
            handlePotentialCrash()
        }
    }

    private fun handlePotentialCrash() {
        Log.d("CrashDetection", "handlePotentialCrash() çağrıldı.")
        fusedLocationClient.lastLocation.addOnSuccessListener { location: Location? ->
            if (location != null) {
                Log.d("CrashDetection", "Konum alındı: (${location.latitude}, ${location.longitude})")
                playAlarmSound()
                sendEmergencySms(location)

                // ✅ İşlem tamam, servisi durdur
                stopSelf()
            } else {
                Log.w("CrashDetection", "Konum verisi alınamadı.")
                stopSelf()
            }
        }.addOnFailureListener {
            Log.e("CrashDetection", "Konum alınırken hata: ${it.message}")
            stopSelf()
        }
    }

    private fun playAlarmSound() {
        try {
            val mediaPlayer = MediaPlayer.create(this, android.provider.Settings.System.DEFAULT_ALARM_ALERT_URI)
            if (mediaPlayer == null) {
                Log.e("CrashDetection", "MediaPlayer null döndü. Alarm sesi çalınamadı.")
                return
            }

            mediaPlayer.setOnCompletionListener { it.release() }
            mediaPlayer.start()
            Log.d("CrashDetection", "🔊 Alarm sesi çalıyor.")
        } catch (e: Exception) {
            Log.e("CrashDetection", "Alarm sesi hatası: ${e.message}")
        }
    }

    private fun sendEmergencySms(location: Location) {
        val contacts = listOf("+905333049681")
        val message = "Kazadan şüphelenildi! Konum: https://maps.google.com/?q=${location.latitude},${location.longitude}"

        try {
            val smsManager = SmsManager.getDefault()
            for (number in contacts) {
                smsManager.sendTextMessage(number, null, message, null, null)
                Log.i("CrashDetection", "✅ SMS gönderildi: $number")
            }
        } catch (e: SecurityException) {
            Log.e("CrashDetection", "❌ SMS gönderme yetkisi yok: ${e.message}")
        } catch (e: Exception) {
            Log.e("CrashDetection", "❌ SMS gönderim hatası: ${e.message}")
        }
    }

    override fun onAccuracyChanged(sensor: Sensor?, accuracy: Int) {}

    override fun onDestroy() {
        super.onDestroy()
        sensorManager.unregisterListener(this)
        Log.d("CrashDetection", "CrashDetectionService durduruldu.")
    }

    override fun onBind(intent: Intent?): IBinder? = null
}
