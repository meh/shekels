module Component

class PaymentList < Lissio::Component
	class Week < Lissio::Component::Container
		def initialize(parent)
			super(parent)

			@previous = nil
			@current  = nil
			@new      = false
		end

		def <<(payment)
			@new = false

			if @previous
				@previous = @previous.at - ((@previous.at.wday - 1) * 24 * 60 * 60)
				@current  = payment.at  - ((payment.at.wday - 1) * 24 * 60 * 60)

				if @previous.strftime('%F') != @current.strftime('%F')
					first = @current
					last  = first + (6 * 24 * 60 * 60)

					render do
						span.start first.strftime('%F')
						span.separator '..'
						span.end last.strftime('%F')
					end

					@new = true
				end
			else
				first = payment.at - ((payment.at.wday - 1) * 24 * 60 * 60)
				last  = first + (6 * 24 * 60 * 60)

				render do
					span.start first.strftime('%F')
					span.separator '..'
					span.end last.strftime('%F')
				end

				@new = true
			end

			@previous = payment
		end

		def new?
			@new
		end

		tag class: :week

		css do
			rule '.week' do
				border bottom: [1.px, :solid, '#555']
				font weight: :bold
				width 18.ch
				margin 10.px, :auto

				rule '.separator' do
					font weight: :normal
					padding left:  10.px,
						    	right: 10.px
				end
			end
		end
	end

	module Payment
		module Person
			class Positive < Lissio::Component::Container
				def initialize(parent, payment)
					super(parent)

					render do
						a.href("/person/#{payment.recipient.name}").text(payment.recipient.name).
							on :click do |e|
								e.stop!; Shekels.navigate(e.target[:href])
							end
						span " owes you"

						span.remover.text(" ₪ ").on :click do |e|
							remove(payment, e.target)
						end

						span.positive payment.amount.to_s

						if payment.for
							span " for "
							span payment.for
						end

						span " on "
						span payment.at.strftime('%A')
					end
				end
			end

			class Negative < Lissio::Component::Container
				def initialize(parent, payment)
					super(parent)

					render do
						span "You owe"

						span.remover.text(" ₪ ").on :click do |e|
							remove(payment, e.target)
						end

						span.negative payment.amount.to_s
						span " to "
						a.href("/person/#{payment.recipient.name}").text(payment.recipient.name).
							on :click do |e|
								e.stop!; Shekels.navigate(e.target[:href])
							end

						if payment.for
							span " for "
							span payment.for
						end

						span " on "
						span payment.at.strftime('%A')
					end
				end
			end
		end

		class Item < Lissio::Component::Container
			def initialize(parent, payment)
				super(parent)

				render do
					span "You spent"

					span.remover.text(" ₪ ").on :click do |e|
						parent.remove(payment, e.target)
					end

					span.negative payment.amount.to_s

					if payment.for
						span " for "
						span payment.for
					end

					span " on "
					span payment.at.strftime('%A')
				end
			end
		end
	end

	attr_accessor :payments

	def initialize(parent, payments = [])
		super(parent)

		@payments = payments
	end

	def remove(payment, target)
		payment.destroy

		parent = target.parent
		succ   = parent.next_element
		prev   = parent.previous_element
		list   = parent.parent

		if prev.class_name == 'week' && (!succ || succ.class_name == 'week')
			prev.remove
			succ.remove if succ
		end

		parent.remove

		if list.children.length == 0
			Shekels.refresh
		end
	end

	def render
		element.clear

		week = Week.new(self)

		@payments.sort_by(&:at).reverse.each {|payment|
			week << payment

			if week.new?
				element << week.element
			end

			if payment.recipient
				if payment.sign == :-
					element << Payment::Person::Negative.new(self, payment).element
				else
					element << Payment::Person::Positive.new(self, payment).element
				end
			else
				element << Payment::Item.new(self, payment).element
			end
		}
	end

	tag name: :div, class: 'payment-list'

	css do
		rule '.payment-list' do
			width 100.%

			rule 'div' do
				line height: 1.5.em

				rule '.remover' do
					cursor :crosshair
				end
			end
		end
	end
end

end
