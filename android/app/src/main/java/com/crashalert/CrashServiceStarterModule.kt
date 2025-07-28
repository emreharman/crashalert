package com.crashalert

import android.content.Intent
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import android.content.Context
import android.content.SharedPreferences
import com.facebook.react.bridge.*
import android.util.Log

class CrashServiceStarterModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    override fun getName(): String = "CrashServiceStarter"

    @ReactMethod
    fun startService() {
        val serviceIntent = Intent(reactContext, CrashDetectionService::class.java)
        reactContext.startForegroundService(serviceIntent)
    }

    @ReactMethod
    fun configureCrashService(config: ReadableMap, promise: Promise) {
        try {
            val prefs: SharedPreferences = reactContext.getSharedPreferences("CrashPrefs", Context.MODE_PRIVATE)
            val editor = prefs.edit()

            editor.putBoolean("alarm", config.getBoolean("alarm"))
            editor.putBoolean("sms", config.getBoolean("sms"))
            editor.putBoolean("location", config.getBoolean("location"))
            editor.putFloat("gLimit", config.getDouble("gLimit").toFloat())
            Log.d("CrashDetection", "🛠️ Konfigürasyon kaydedildi: gLimit=${config.getDouble("gLimit")}")

            editor.apply()
            promise.resolve(true)
        } catch (e: Exception) {
            promise.reject("CONFIG_ERROR", e.message, e)
        }
    }
}
