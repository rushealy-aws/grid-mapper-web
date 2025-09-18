import json
import boto3
import base64
import tempfile
import os
import logging
from datetime import datetime
from typing import Dict, Any
import subprocess
import sys

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for generating Maidenhead grid square maps
    """
    try:
        # Parse request body
        body = json.loads(event['body']) if isinstance(event.get('body'), str) else event.get('body', {})
        
        # Extract parameters
        file_content = body.get('fileContent', '')
        file_name = body.get('fileName', 'contest_log')
        callsign = body.get('callsign', 'Unknown')
        continents = body.get('continents', [])
        
        logger.info(f"Processing map generation for callsign: {callsign}")
        
        if not file_content:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'No file content provided'})
            }
        
        # Create temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            # Write file content to temporary file
            file_path = os.path.join(temp_dir, file_name)
            
            # Handle base64 encoded content
            try:
                if file_content.startswith('data:'):
                    # Remove data URL prefix
                    file_content = file_content.split(',')[1]
                file_data = base64.b64decode(file_content)
                with open(file_path, 'wb') as f:
                    f.write(file_data)
            except:
                # Assume plain text content
                with open(file_path, 'w') as f:
                    f.write(file_content)
            
            # Copy the map generator script to temp directory
            script_content = get_map_generator_script()
            script_path = os.path.join(temp_dir, 'maidenhead_map.py')
            with open(script_path, 'w') as f:
                f.write(script_content)
            
            # Install required packages
            subprocess.check_call([
                sys.executable, '-m', 'pip', 'install', 
                'matplotlib', 'cartopy', 'numpy', '--target', temp_dir
            ])
            
            # Set PYTHONPATH to include temp directory
            env = os.environ.copy()
            env['PYTHONPATH'] = temp_dir
            
            # Generate maps
            cmd = [sys.executable, script_path, file_path]
            if continents:
                cmd.extend(['--continents'] + continents)
            
            result = subprocess.run(cmd, capture_output=True, text=True, cwd=temp_dir, env=env)
            
            if result.returncode != 0:
                logger.error(f"Map generation failed: {result.stderr}")
                return {
                    'statusCode': 500,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'error': f'Map generation failed: {result.stderr}'})
                }
            
            # Upload generated maps to S3
            maps_bucket = os.environ['MAPS_BUCKET']
            date_folder = datetime.now().strftime('%Y-%m-%d')
            s3_prefix = f"{date_folder}/{callsign}/"
            
            uploaded_maps = []
            
            # Find and upload PNG files
            for file in os.listdir(temp_dir):
                if file.endswith('.png'):
                    local_path = os.path.join(temp_dir, file)
                    s3_key = f"{s3_prefix}{file}"
                    
                    s3_client.upload_file(local_path, maps_bucket, s3_key)
                    
                    # Generate presigned URL for download
                    download_url = s3_client.generate_presigned_url(
                        'get_object',
                        Params={'Bucket': maps_bucket, 'Key': s3_key},
                        ExpiresIn=3600  # 1 hour
                    )
                    
                    uploaded_maps.append({
                        'filename': file,
                        'downloadUrl': download_url,
                        's3Key': s3_key
                    })
            
            logger.info(f"Successfully generated {len(uploaded_maps)} maps for {callsign}")
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({
                    'success': True,
                    'callsign': callsign,
                    'mapsGenerated': len(uploaded_maps),
                    'maps': uploaded_maps,
                    'logOutput': result.stdout
                })
            }
            
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'error': f'Internal server error: {str(e)}'})
        }

def get_map_generator_script() -> str:
    """
    Returns the map generator script content
    """
    # Read the actual maidenhead_map.py script
    script_path = os.path.join(os.path.dirname(__file__), 'maidenhead_map.py')
    with open(script_path, 'r') as f:
        return f.read()
