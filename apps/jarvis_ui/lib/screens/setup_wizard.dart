import 'package:flutter/material.dart';
import '../api/jarvis_client.dart';
import 'dashboard.dart';

class SetupGate extends StatefulWidget{
  const SetupGate({super.key,required this.client});
  final JarvisClient client;

  @override
  State<SetupGate> createState()=>_SetupGateState();
}

class _SetupGateState extends State<SetupGate>{
  bool loading=true;
  bool complete=false;
  String? error;

  @override
  void initState(){
    super.initState();
    _load();
  }

  Future<void> _load() async{
    try{
      final data=await widget.client.settings();
      final settings=(data['settings'] as List<dynamic>? ?? const []);
      final entry=settings.cast<Map<String,dynamic>>().where((e)=>e['key']=='firstRunComplete').firstOrNull;
      if(!mounted)return;
      setState((){complete=entry?['value']==true;loading=false;});
    }catch(e){
      if(mounted)setState((){error=e.toString();loading=false;});
    }
  }

  @override
  Widget build(BuildContext context){
    if(loading)return const Scaffold(body:Center(child:CircularProgressIndicator()));
    if(complete)return DashboardScreen(client:widget.client);
    return SetupWizard(
      client:widget.client,
      initialError:error,
      onComplete:()=>setState(()=>complete=true),
    );
  }
}

class SetupWizard extends StatefulWidget{
  const SetupWizard({super.key,required this.client,required this.onComplete,this.initialError});
  final JarvisClient client;
  final VoidCallback onComplete;
  final String? initialError;

  @override
  State<SetupWizard> createState()=>_SetupWizardState();
}

class _SetupWizardState extends State<SetupWizard>{
  final assistantName=TextEditingController(text:'Neko');
  final aiEndpoint=TextEditingController(text:'http://127.0.0.1:11434/v1');
  final aiModel=TextEditingController(text:'qwen2.5:3b');
  final haUrl=TextEditingController();
  final haToken=TextEditingController();
  final discordToken=TextEditingController();
  String piperVoice='en_GB-jarvis-medium';
  bool localOnly=false;
  String status='Configure Jarvis, then test the core and voice before finishing.';
  bool busy=false;

  Future<void> _testAi() async{
    setState(()=>busy=true);
    try{
      final health=await widget.client.health();
      setState(()=>status=health['ai']?['reachable']==true
        ? 'AI provider connection is healthy.'
        : 'AI provider is not reachable: ${health['ai']}');
    }catch(e){setState(()=>status='AI test failed: $e');}
    finally{if(mounted)setState(()=>busy=false);}
  }

  Future<void> _previewVoice() async{
    setState(()=>busy=true);
    try{
      final result=await widget.client.piperPreview(voice:piperVoice,text:'Jarvis setup voice test.');
      setState(()=>status='Piper voice downloaded and preview generated: ${result['outputPath']}');
    }catch(e){setState(()=>status='Piper preview failed: $e');}
    finally{if(mounted)setState(()=>busy=false);}
  }

  Future<void> _finish() async{
    setState(()=>busy=true);
    try{
      await widget.client.updateSettings({
        'assistantName':assistantName.text.trim(),
        'aiEndpoint':aiEndpoint.text.trim(),
        'aiModel':aiModel.text.trim(),
        'piperVoice':piperVoice,
        'localOnly':localOnly,
        'homeAssistantUrl':haUrl.text.trim(),
        'homeAssistantToken':haToken.text,
        'discordBotToken':discordToken.text,
      });
      final health=await widget.client.health();
      if(health['ok']!=true && health['degraded']!=true){
        throw Exception('Core health check did not return a usable state.');
      }
      await widget.client.updateSettings({'firstRunComplete':true});
      widget.onComplete();
    }catch(e){
      if(mounted)setState(()=>status='Setup could not complete: $e');
    }finally{
      if(mounted)setState(()=>busy=false);
    }
  }

  @override
  void dispose(){
    assistantName.dispose();aiEndpoint.dispose();aiModel.dispose();
    haUrl.dispose();haToken.dispose();discordToken.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context){
    return Scaffold(
      body:SafeArea(
        child:ListView(
          padding:const EdgeInsets.all(24),
          children:[
            const Text('NEKOSUNE JARVIS SETUP',style:TextStyle(fontSize:24,fontWeight:FontWeight.bold,letterSpacing:2)),
            const SizedBox(height:10),
            const Text('Jarvis keeps dangerous tools permission-gated. You can change permissions later; write, shell, device-control and smart-home actions default to asking or denying.'),
            const SizedBox(height:20),
            TextField(controller:assistantName,decoration:const InputDecoration(labelText:'Assistant name')),
            const SizedBox(height:10),
            TextField(controller:aiEndpoint,decoration:const InputDecoration(labelText:'AI endpoint')),
            const SizedBox(height:10),
            TextField(controller:aiModel,decoration:const InputDecoration(labelText:'AI model')),
            const SizedBox(height:10),
            DropdownButtonFormField<String>(
              value:piperVoice,
              decoration:const InputDecoration(labelText:'Piper Jarvis voice'),
              items:const [
                DropdownMenuItem(value:'en_GB-jarvis-medium',child:Text('Jarvis Medium')),
                DropdownMenuItem(value:'en_GB-jarvis-high',child:Text('Jarvis High')),
              ],
              onChanged:(v)=>setState(()=>piperVoice=v??piperVoice),
            ),
            SwitchListTile(
              value:localOnly,
              onChanged:(v)=>setState(()=>localOnly=v),
              title:const Text('Local-only mode'),
              subtitle:const Text('Prefer local AI, voice and LAN integrations.'),
            ),
            const Divider(height:32),
            TextField(controller:haUrl,decoration:const InputDecoration(labelText:'Home Assistant URL (optional)')),
            const SizedBox(height:10),
            TextField(controller:haToken,obscureText:true,decoration:const InputDecoration(labelText:'Home Assistant token (optional)')),
            const SizedBox(height:10),
            TextField(controller:discordToken,obscureText:true,decoration:const InputDecoration(labelText:'Discord bot token (optional)')),
            const SizedBox(height:20),
            Wrap(
              spacing:10,runSpacing:10,
              children:[
                OutlinedButton(onPressed:busy?null:_testAi,child:const Text('Test AI / Core')),
                OutlinedButton(onPressed:busy?null:_previewVoice,child:const Text('Download + Preview Piper')),
                FilledButton(onPressed:busy?null:_finish,child:const Text('Finish Setup')),
              ],
            ),
            const SizedBox(height:16),
            if(busy)const LinearProgressIndicator(),
            const SizedBox(height:10),
            Text(status),
            if(widget.initialError!=null)Text(widget.initialError!,style:const TextStyle(color:Colors.orangeAccent)),
          ],
        ),
      ),
    );
  }
}

extension _FirstWhereOrNull<E> on Iterable<E>{
  E? get firstOrNull=>isEmpty?null:first;
}
