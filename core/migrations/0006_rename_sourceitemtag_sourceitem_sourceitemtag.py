# Generated by Django 5.1.6 on 2025-02-18 12:16

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('core', '0005_apirootitem_scrapapikey'),
    ]

    operations = [
        migrations.RenameField(
            model_name='sourceitem',
            old_name='SourceItemTag',
            new_name='sourceItemTag',
        ),
    ]
