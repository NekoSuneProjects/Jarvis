import test from "node:test";
import assert from "node:assert/strict";

test("built config loads with safe defaults", async () => {
  const previous={...process.env};
  try{
    for(const key of Object.keys(process.env)){
      if(key.startsWith("JARVIS_")||key.startsWith("AI_")||key.startsWith("PIPER_")||key.startsWith("HOME_ASSISTANT_")||key.startsWith("MQTT_")) delete process.env[key];
    }
    const module=await import("../dist/config.js?test="+Date.now());
    assert.equal(module.config.host,"127.0.0.1");
    assert.equal(module.config.port,3000);
    assert.equal(module.config.piper.voice,"en_GB-jarvis-medium");
    assert.equal(module.config.ai.provider,"ollama");
  }finally{
    process.env=previous;
  }
});
