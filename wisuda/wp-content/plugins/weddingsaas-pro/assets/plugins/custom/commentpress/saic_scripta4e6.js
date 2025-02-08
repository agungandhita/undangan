jQuery(document).ready(function ($) {

    $(this).find(':submit').removeAttr("disabled");

    SAIC = {
        ajaxurl: SAIC_WP.ajaxurl,
        nonce: SAIC_WP.saicNonce,
        jpages: 'true',
        textCounter: 'true',
        autoLoad: 'true',
        widthWrap: '',
        numPerPage: SAIC_WP.jPagesNum,
        textCounterNum: SAIC_WP.textCounterNum,
        thanksComment: SAIC_WP.thanksComment,
        thanksReplyComment: SAIC_WP.thanksReplyComment,
        duplicateComment: SAIC_WP.duplicateComment,
        textWriteComment: SAIC_WP.textWriteComment
    };

    // Remove duplicate comment box
    $('.saic-wrap-comments').each(function (index, element) {
        var ids = $('[id=\'' + this.id + '\']');
        if (ids.length > 1) {
            ids.slice(1).closest('.saic-wrapper').remove();
        }
    });

    // Remove id from input hidden comment_parent and comment_post_ID
    $('.saic-container-form [name="comment_parent"], .saic-container-form [name="comment_post_ID"]').each(function (index, input) {
        $(input).removeAttr('id');
    });

    // Textarea counter plugin
    if (typeof jQuery.fn.textareaCount == 'function' && SAIC.textCounter == 'true') {
        $('.saic-textarea').each(function () {
            var textCount = {
                'maxCharacterSize': SAIC.textCounterNum,
                'originalStyle': 'saic-counter-info',
                'warningStyle': 'saic-counter-warn',
                'warningNumber': 20,
                'displayFormat': '#left'
            };
            $(this).textareaCount(textCount);
        });
    }

    // PlaceHolder plugin
    if (typeof jQuery.fn.placeholder == 'function') {
        $('.saic-wrap-form input, .saic-wrap-form textarea').placeholder();
    }

    // Autosize plugin
    if (typeof autosize == 'function') {
        autosize($('textarea.saic-textarea'));
    }

    // Resize width wrapper
    $('.saic-wrapper').each(function () {
        rezizeBoxComments_SAIC($(this));
    });
    $(window).resize(function () {
        $('.saic-wrapper').each(function () {
            rezizeBoxComments_SAIC($(this));
        });
    });

    // Show hide comment wrapper
    $('body').on('click', 'a.saic-link', function (e) {
        e.preventDefault();
        var linkVars = getUrlVars_SAIC($(this).attr('href'));
        var post_id = linkVars.post_id;
        var num_comments = linkVars.comments;
        var num_get_comments = linkVars.get;
        var order_comments = linkVars.order;
        $("#saic-wrap-commnent-" + post_id).slideToggle(200);
        var $container_comment = $('#saic-container-comment-' + post_id);
        if ($container_comment.length && $container_comment.html().length === 0) {
            getComments_SAIC(post_id, num_comments, num_get_comments, order_comments);
        }
        return false;
    });

    // Click autoload
    if ($('a.saic-link').length) {
        $('a.saic-link.auto-load-true').each(function () {
            $(this).click();
        });
    }

    // Cancel ESC
    $('body').find('.saic-container-form').keyup(function (tecla) {
        post_id = $(this).find('form').attr('id').replace('commentform-', '');
        if (tecla.which == 27) {
            cancelCommentAction_SAIC(post_id);
        }
    });

    // Cancel button
    $('body').on('click', 'input.saic-cancel-btn', function (event) {
        event.stopPropagation();
        post_id = $(this).closest('form').attr('id').replace('commentform-', '');
        cancelCommentAction_SAIC(post_id);
    });

    // Reply button
    $('body').on('click', '.saic-reply-link', function (e) {
        e.preventDefault();
        var linkVars = getUrlVars_SAIC($(this).attr('href'));
        var comment_id = linkVars.comment_id;
        var post_id = linkVars.post_id;
        cancelCommentAction_SAIC(post_id);
        var form = $('#commentform-' + post_id);
        form.find('[name="comment_parent"]').val(comment_id);
        form.find('.saic-textarea').val('').attr('placeholder', SAIC_WP.reply + '. ESC (' + SAIC_WP.cancel + ')').focus();
        form.find('input[name="submit"]').addClass('saic-reply-action');
        $('#commentform-' + post_id).find('input.saic-cancel-btn').show();
        scrollThis_SAIC(form);

        return false;
    });

    // Edit button
    $('body').on('click', '.saic-edit-link', function (e) {
        e.preventDefault();
        var linkVars = getUrlVars_SAIC($(this).attr('href'));
        var comment_id = linkVars.comment_id;
        var post_id = linkVars.post_id;
        cancelCommentAction_SAIC(post_id);
        var form = $('#commentform-' + post_id);
        form.find('[name="comment_parent"]').val(comment_id);
        form.find('.saic-textarea').val('').focus();
        form.find('input[name="submit"]').addClass('saic-edit-action');
        scrollThis_SAIC(form);
        getCommentText_SAIC(post_id, comment_id);
    });

    // Delete button
    $('body').on('click', '.saic-delete-link', function (e) {
        e.preventDefault();
        var linkVars = getUrlVars_SAIC($(this).attr('href'));
        var comment_id = linkVars.comment_id;
        var post_id = linkVars.post_id;
        if (confirm('are you sure you want to delete?')) {
            deleteComment_SAIC(post_id, comment_id);
        }
    });

    // Hide error
    $('input, select, textarea').focus(function (event) {
        $(this).removeClass('saic-error');
        $(this).siblings('.saic-error-info').hide();
    });

    // Show guest
    $('#attendance').change(function () {
        var selectedValue = $(this).val();
        if (selectedValue === 'present') {
            $('.saic-wrap-guest').show();
        } else {
            $('.saic-wrap-guest').hide();
        }
    });

    // Submit form
    $('body').on('submit', '.saic-container-form form', function (event) {
        event.preventDefault();
        $(this).find(':submit').attr("disabled", "disabled");
        $('input, textarea').removeClass('saic-error');
        var formID = $(this).attr('id');
        var post_id = formID.replace('commentform-', '');
        var form = $('#commentform-' + post_id);
        var link_show_comments = $('#saic-link-' + post_id);
        var num_comments = link_show_comments.attr('href').split('=')[2];
        var form_ok = true;

        var $content = form.find('textarea').val().replace(/\s+/g, ' ');
        if ($content.length < 2) {
            form.find('.saic-textarea').addClass('saic-error');
            form.find('.saic-error-info-text').show();
            setTimeout(function () {
                form.find('.saic-error-info-text').fadeOut(500);
            }, 2500);
            $(this).find(':submit').removeAttr('disabled');
            return false;
        } else {
            if ($(this).find('input#author').length) {
                var $author = $(this).find('input#author');
                var $authorVal = $author.val().replace(/\s+/g, ' ');
                var $authorRegEx = /^[^?%$=\/]{1,30}$/i;
                if ($authorVal == ' ' || !$authorRegEx.test($authorVal)) {
                    $author.addClass('saic-error');
                    form.find('.saic-error-info-name').show();
                    setTimeout(function () {
                        form.find('.saic-error-info-name').fadeOut(500);
                    }, 3000);
                    form_ok = false;
                }
            }

            if ($(this).find('input#email').length) {
                var $emailRegEx = /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,6}$/i;
                var $email = $(this).find('input#email');
                var $emailVal = $email.val().replace(/\s+/g, '');
                $email.val($emailVal);
                if (!$emailRegEx.test($emailVal)) {
                    $email.addClass('saic-error');
                    form.find('.saic-error-info-email').show();
                    setTimeout(function () {
                        form.find('.saic-error-info-email').fadeOut(500);
                    }, 3000);
                    form_ok = false;
                }
            }

            // Required for attendance & guest
            if ($(this).find('select#attendance').length) {
                var $attendance = $(this).find('select#attendance');
                var $guest = $(this).find('select#guest');
                if ($attendance.length > 0) {
                    var $attendanceVal = $attendance.val();
                    if ($attendanceVal !== null && $attendanceVal.trim() !== '') {
                        // Required attendance
                        $attendanceVals = $attendanceVal.replace(/\s+/g, ' ');
                        var $attendanceRegEx = /^[^?&%$=\/]{1,30}$/i;
                        if (!$attendanceRegEx.test($attendanceVals)) {
                            $attendance.addClass('saic-error');
                            form.find('.saic-error-info-attendance').show();
                            setTimeout(function () {
                                form.find('.saic-error-info-attendance').fadeOut(500);
                            }, 3000);
                            form_ok = false;
                        }
                        // Required guest
                        if ($attendanceVal == 'present') {
                            var $guestVal = $guest.val();
                            if ($guestVal == null || $guestVal.trim() == '') {
                                $guest.addClass('saic-error');
                                form.find('.saic-error-info-guest').show();
                                setTimeout(function () {
                                    form.find('.saic-error-info-guest').fadeOut(500);
                                }, 3000);
                                form_ok = false;
                            }
                        }
                    } else {
                        $attendance.addClass('saic-error');
                        form.find('.saic-error-info-attendance').show();
                        setTimeout(function () {
                            form.find('.saic-error-info-attendance').fadeOut(500);
                        }, 3000);
                        form_ok = false;
                    }
                }
            }

            if (!form_ok) {
                $(this).find(':submit').removeAttr('disabled');
                return false;
            }

            if (form_ok === true) {
                if (!form.find('input[name="comment_press"]').length) {
                    form.find('input[name="submit"]').after('<input type="hidden" name="comment_press" value="true">');
                }
                comment_id = form.find('[name="comment_parent"]').val();
                if (form.find('input[name="submit"]').hasClass('saic-edit-action')) {
                    editComment_SAIC(post_id, comment_id);
                }
                else if (form.find('input[name="submit"]').hasClass('saic-reply-action')) {
                    insertCommentReply_SAIC(post_id, comment_id, num_comments);
                }
                else {
                    insertComment_SAIC(post_id, num_comments);
                }
                cancelCommentAction_SAIC(post_id);
            }
            $(this).find(':submit').removeAttr('disabled');
        }
        return false;
    });

});

// Ajax 'get_comments'
function getComments_SAIC(post_id, num_comments, num_get_comments, order_comments) {
    var status = jQuery('#saic-comment-status-' + post_id);
    var $container_comments = jQuery("ul#saic-container-comment-" + post_id);
    if (num_comments > 0) {
        jQuery.ajax({
            type: "POST",
            dataType: "html",
            url: SAIC.ajaxurl,
            data: {
                action: 'get_comments',
                post_id: post_id,
                get: num_get_comments,
                order: order_comments,
                nonce: SAIC.nonce
            },
            beforeSend: function () {
                status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
            },
            success: function (data) {
                status.removeClass('saic-loading').html('').hide();
                $container_comments.html(data);
                $container_comments.show();
                jPages_SAIC(post_id, SAIC.numPerPage);
            },
            error: function (jqXHR, textStatus, errorThrown) {
                clog('ajax error');
                clog('jqXHR');
                clog(jqXHR);
                clog('errorThrown');
                clog(errorThrown);
            },
            complete: function (jqXHR, textStatus) {
            }
        });
    }
    return false;
}

// Ajax insert site_url('/wp-comments-post.php')
function insertComment_SAIC(post_id, num_comments) {
    var link_show_comments = jQuery('#saic-link-' + post_id);
    var comment_form = jQuery('#commentform-' + post_id);
    var status = jQuery('#saic-comment-status-' + post_id);
    var form_data = comment_form.serialize();

    jQuery.ajax({
        type: 'post',
        method: 'post',
        url: comment_form.attr('action'),
        data: form_data,
        dataType: "html",
        beforeSend: function () {
            status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
        },
        success: function (data, textStatus) {
            status.removeClass('saic-loading').html('');
            if (data != "error") {
                status.html('<p class="saic-ajax-success">' + SAIC.thanksComment + '</p>');
                if (link_show_comments.find('span').length) {
                    num_comments = String(parseInt(num_comments, 10) + 1);
                    link_show_comments.find('span').html(num_comments);
                }
            }
            else {
                status.html('<p class="saic-ajax-error">Error processing form</p>');
            }
            jQuery('ul#saic-container-comment-' + post_id).prepend(data).show();
            jPages_SAIC(post_id, SAIC.numPerPage, true);
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            status.removeClass('saic-loading').html('<p class="saic-ajax-error" >' + SAIC.duplicateComment + '</p>');
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function () {
                status.removeClass('saic-loading').fadeOut(600);
            }, 2500);
        }
    });
    return false;
}

// Ajax reply site_url('/wp-comments-post.php')
function insertCommentReply_SAIC(post_id, comment_id, num_comments) {
    var link_show_comments = jQuery('#saic-link-' + post_id);
    var comment_form = jQuery('#commentform-' + post_id);
    var status = jQuery('#saic-comment-status-' + post_id);
    var item_comment = jQuery('#saic-item-comment-' + comment_id);
    var form_data = comment_form.serialize();

    jQuery.ajax({
        type: 'post',
        method: 'post',
        url: comment_form.attr('action'),
        data: form_data,
        beforeSend: function () {
            status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
        },
        success: function (data, textStatus) {
            status.removeClass('saic-loading').html('');
            if (data != "error") {
                status.html('<p class="saic-ajax-success">' + SAIC.thanksReplyComment + '</p>');
                if (link_show_comments.find('span').length) {
                    num_comments = parseInt(num_comments, 10) + 1;
                    link_show_comments.find('span').html(num_comments);
                }
                if (!item_comment.find('ul').length) {
                    item_comment.append('<ul class="children"></ul>');
                }
                item_comment.find('ul').append(data);

                setTimeout(function () {
                    scrollThis_SAIC(item_comment.find('ul li').last());
                }, 1000);
            }
            else {
                status.html('<p class="saic-ajax-error">Error in processing your form.</p>');
            }
        },
        error: function (XMLHttpRequest, textStatus, errorThrown) {
            status.html('<p class="saic-ajax-error" >' + SAIC.duplicateComment + '</p>');
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function () {
                status.removeClass('saic-loading').fadeOut(600);
            }, 2500);
        }
    });
    return false;

}

// Ajax edit 'edit_comment_saic'
function editComment_SAIC(post_id, comment_id) {
    var form = jQuery("#commentform-" + post_id);
    var status = jQuery('#saic-comment-status-' + post_id);
    jQuery.ajax({
        type: "POST",
        url: SAIC.ajaxurl,
        data: {
            action: 'edit_comment_saic',
            post_id: post_id,
            comment_id: comment_id,
            comment_content: form.find('.saic-textarea').val(),
            nonce: SAIC.nonce
        },
        beforeSend: function () {
            status.addClass('saic-loading').html('<span class="saico-loading"></span>').show();
        },
        success: function (result) {
            status.removeClass('saic-loading').html('');
            var data = jQuery.parseJSON(result);
            if (data.ok === true) {
                jQuery('#saic-comment-' + comment_id).find('.saic-comment-text').html(data.comment_text);
                setTimeout(function () {
                    scrollThis_SAIC(jQuery('#saic-comment-' + comment_id));
                }, 1000);
            }
            else {
                console.log("Errors: " + data.error);
            }
        },
        complete: function (jqXHR, textStatus) {
            setTimeout(function () {
                status.removeClass('saic-loading').fadeOut(600);
            }, 2500);
        }
    });
    return false;
}

// Ajax 'get_comment_text_saic'
function getCommentText_SAIC(post_id, comment_id) {
    jQuery.ajax({
        type: "POST",
        dataType: "html",
        url: SAIC.ajaxurl,
        data: {
            action: 'get_comment_text_saic',
            post_id: post_id,
            comment_id: comment_id,
            nonce: SAIC.nonce
        },
        beforeSend: function () {
        },
        success: function (data) {
            if (data !== 'saic-error') {
                jQuery('#saic-textarea-' + post_id).val(data);
                autosize.update(jQuery('#saic-textarea-' + post_id));
                jQuery('#commentform-' + post_id).find('input.saic-cancel-btn').show();
            }
        }
    });
    return false;
}

// Ajax 'delete_comment_saic'
function deleteComment_SAIC(post_id, comment_id) {
    jQuery.ajax({
        type: "POST",
        dataType: "html",
        url: SAIC.ajaxurl,
        data: {
            action: 'delete_comment_saic',
            post_id: post_id,
            comment_id: comment_id,
            nonce: SAIC.nonce
        },
        beforeSend: function () {
        },
        success: function (data) {
            if (data === 'ok') {
                jQuery('#saic-item-comment-' + comment_id).remove();
            }
        }
    });
    return false;
}

// jPages plugin
function jPages_SAIC(post_id, $numPerPage, $destroy) {
    if (typeof jQuery.fn.jPages == 'function' && SAIC.jpages == 'true') {
        var $idList = 'saic-container-comment-' + post_id;
        var $holder = 'div.saic-holder-' + post_id;
        var num_comments = jQuery('#' + $idList + ' > li').length;
        if (num_comments > $numPerPage) {
            if ($destroy) {
                jQuery('#' + $idList).children().removeClass('animated jp-hidden');
            }
            jQuery($holder).show().jPages({
                containerID: $idList,
                previous: SAIC_WP.textNavPrev,
                next: SAIC_WP.textNavNext,
                perPage: parseInt($numPerPage, 10),
                minHeight: false,
                keyBrowse: true,
                direction: "forward",
                animation: "fadeIn",
            });
        }
    }
    return false;
}

// Scroll
function scrollThis_SAIC($this) {
    if ($this.length) {
        var $position = $this.offset().top;
        var newPosition = findPosition_SAIC($this);
        var $scrollThis = Math.abs(newPosition - 200);
        jQuery('html,body').animate({ scrollTop: $scrollThis }, 'slow');
    }
    return false;
}

// Find position
function findPosition_SAIC($el) {
    var node = $el.get(0);
    var curtop = 0;
    var curtopscroll = 0;
    if (node.offsetParent) {
        do {
            curtop += node.offsetTop;
            curtopscroll += node.offsetParent ? node.offsetParent.scrollTop : 0;
        } while (node = node.offsetParent);
        return curtop;
    }
    return 0;
}

// Get url var
function getUrlVars_SAIC(url) {
    var query = url.substring(url.indexOf('?') + 1);
    var parts = query.split("&");
    var params = {};
    for (var i = 0; i < parts.length; i++) {
        var pair = parts[i].split("=");
        params[pair[0]] = pair[1];
    }
    return params;
}

// Cancel comment
function cancelCommentAction_SAIC(post_id) {
    jQuery('form#commentform-' + post_id).find('[name="comment_parent"]').val('0');
    jQuery('form#commentform-' + post_id).find('.saic-textarea').val('').attr('placeholder', SAIC.textWriteComment);
    jQuery('form#commentform-' + post_id).find('input[name="submit"]').removeClass();
    jQuery('form#commentform-' + post_id).find('input.saic-cancel-btn').hide();
    autosize.update(jQuery('#saic-textarea-' + post_id));
    jQuery('input, select, textarea').removeClass('saic-error');
}

// Resize box comment
function rezizeBoxComments_SAIC(wrapper) {
    var widthWrapper = SAIC.widthWrap ? parseInt(SAIC.widthWrap, 10) : wrapper.outerWidth();
    if (widthWrapper <= 480) {
        wrapper.addClass('saic-full');
    } else {
        wrapper.removeClass('saic-full');
    }
}

// Console log
function clog(msg) {
    console.log(msg);
}